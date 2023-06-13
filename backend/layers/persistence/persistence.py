import contextlib
import json
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Iterable, List, Optional, Tuple

from sqlalchemy import create_engine
from sqlalchemy.exc import ProgrammingError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from backend.common.corpora_config import CorporaDbConfig
from backend.layers.business.exceptions import CollectionIsPublishedException
from backend.layers.common.entities import (
    CanonicalCollection,
    CanonicalDataset,
    CollectionId,
    CollectionMetadata,
    CollectionVersion,
    CollectionVersionId,
    CollectionVersionWithDatasets,
    DatasetArtifact,
    DatasetArtifactId,
    DatasetArtifactType,
    DatasetConversionStatus,
    DatasetId,
    DatasetMetadata,
    DatasetProcessingStatus,
    DatasetStatus,
    DatasetUploadStatus,
    DatasetValidationStatus,
    DatasetVersion,
    DatasetVersionId,
)
from backend.layers.common.helpers import set_revised_at_field
from backend.layers.persistence.constants import SCHEMA_NAME
from backend.layers.persistence.orm import (
    CollectionTable,
    CollectionVersionTable,
    DatasetArtifactTable,
    DatasetTable,
    DatasetVersionTable,
)
from backend.layers.persistence.persistence_interface import DatabaseProviderInterface, PersistenceException

logger = logging.getLogger(__name__)


class DatabaseProvider(DatabaseProviderInterface):
    def __init__(self, database_uri: str = None, schema_name: str = SCHEMA_NAME) -> None:
        if not database_uri:
            database_uri = CorporaDbConfig().database_uri
        self._engine = create_engine(database_uri, connect_args={"connect_timeout": 5})
        self._session_maker = sessionmaker(bind=self._engine)
        self._schema_name = schema_name
        with contextlib.suppress(Exception):
            self._create_schema()

    def _drop_schema(self):
        from sqlalchemy.schema import DropSchema

        with contextlib.suppress(ProgrammingError):
            self._engine.execute(DropSchema(self._schema_name, cascade=True))

    def _create_schema(self):
        from sqlalchemy.schema import CreateSchema

        from backend.layers.persistence.orm import metadata

        self._engine.execute(CreateSchema(self._schema_name))
        metadata.schema = self._schema_name
        metadata.create_all(bind=self._engine)

    @contextmanager
    def _manage_session(self, **kwargs):
        try:
            if not self._session_maker:
                self._session_maker = sessionmaker(bind=self._engine)
            session = self._session_maker(**kwargs)
            yield session
            if session.transaction:
                session.commit()
            else:
                session.expire_all()
        except SQLAlchemyError as e:
            logger.exception(e)
            if session is not None:
                session.rollback()
            raise PersistenceException("Failed to commit.") from None
        finally:
            if session is not None:
                session.close()

    def _row_to_collection_version(self, row: Any, canonical_collection: CanonicalCollection) -> CollectionVersion:
        return CollectionVersion(
            collection_id=CollectionId(str(row.collection_id)),
            version_id=CollectionVersionId(str(row.id)),
            owner=row.owner,
            curator_name=row.curator_name,
            metadata=CollectionMetadata.from_json(row.collection_metadata),
            publisher_metadata=None if row.publisher_metadata is None else json.loads(row.publisher_metadata),
            datasets=[DatasetVersionId(str(id)) for id in row.datasets],
            published_at=row.published_at,
            created_at=row.created_at,
            canonical_collection=canonical_collection,
        )

    def _row_to_collection_version_with_datasets(
        self, row: Any, canonical_collection: CanonicalCollection, datasets: List[DatasetVersion]
    ) -> CollectionVersionWithDatasets:
        return CollectionVersionWithDatasets(
            collection_id=CollectionId(str(row.collection_id)),
            version_id=CollectionVersionId(str(row.id)),
            owner=row.owner,
            curator_name=row.curator_name,
            metadata=CollectionMetadata.from_json(row.collection_metadata),
            publisher_metadata=None if row.publisher_metadata is None else json.loads(row.publisher_metadata),
            datasets=datasets,
            published_at=row.published_at,
            created_at=row.created_at,
            canonical_collection=canonical_collection,
        )

    def _row_to_canonical_dataset(self, row: Any):
        return CanonicalDataset(
            DatasetId(str(row.id)),
            None if row.version_id is None else DatasetVersionId(str(row.version_id)),
            row.tombstone,
            row.published_at,
        )

    def _row_to_dataset_artifact(self, row: Any):
        return DatasetArtifact(
            DatasetArtifactId(str(row.id)),
            row.type,
            row.uri,
        )

    def _row_to_dataset_version(self, row: Any, canonical_dataset: CanonicalDataset, artifacts: List[DatasetArtifact]):
        if type(row.status) is DatasetStatus or row.status is None:
            status = row.status
        else:
            status = DatasetStatus.from_json(row.status)
        if type(row.dataset_metadata) is DatasetMetadata or row.dataset_metadata is None:
            metadata = row.dataset_metadata
        else:
            metadata = DatasetMetadata.from_json(row.dataset_metadata)
        return DatasetVersion(
            DatasetId(str(row.dataset_id)),
            DatasetVersionId(str(row.id)),
            CollectionId(str(row.collection_id)),
            status,
            metadata,
            artifacts,
            row.created_at,
            canonical_dataset,
        )

    def _hydrate_dataset_version(self, dataset_version: DatasetVersionTable) -> DatasetVersion:
        """
        Populates canonical_dataset, artifacts, and status for single DatasetVersionRow
        """
        canonical_dataset = self.get_canonical_dataset(DatasetId(str(dataset_version.dataset_id)))
        artifacts = self.get_dataset_artifacts(dataset_version.artifacts)
        return self._row_to_dataset_version(dataset_version, canonical_dataset, artifacts)

    def get_canonical_collection(self, collection_id: CollectionId) -> CanonicalCollection:
        with self._manage_session() as session:
            collection = session.query(CollectionTable).filter_by(id=collection_id.id).one_or_none()
            if collection is None:
                return None
            return CanonicalCollection(
                CollectionId(str(collection.id)),
                None if collection.version_id is None else CollectionVersionId(str(collection.version_id)),
                collection.originally_published_at,
                collection.revised_at,
                collection.tombstone,
            )

    def get_canonical_dataset(self, dataset_id: DatasetId) -> CanonicalDataset:
        with self._manage_session() as session:
            dataset = session.query(DatasetTable).filter_by(id=dataset_id.id).one_or_none()
            if dataset is None:
                return None
            return CanonicalDataset(
                dataset_id,
                None if dataset.version_id is None else DatasetVersionId(str(dataset.version_id)),
                dataset.tombstone,
                dataset.published_at,
            )

    def create_canonical_collection(
        self, owner: str, curator_name: str, collection_metadata: CollectionMetadata
    ) -> CollectionVersion:
        """
        Creates a new canonical collection, generating a canonical collection_id and a new version_id.
        Returns the newly created CollectionVersion
        """
        collection_id = CollectionId()
        version_id = CollectionVersionId()
        now = datetime.utcnow()
        canonical_collection = CollectionTable(
            id=collection_id.id, version_id=None, tombstone=False, originally_published_at=None, revised_at=None
        )

        collection_version_row = CollectionVersionTable(
            id=version_id.id,
            collection_id=collection_id.id,
            owner=owner,
            curator_name=curator_name,
            collection_metadata=collection_metadata.to_json(),
            publisher_metadata=None,
            published_at=None,
            created_at=now,
            datasets=list(),
        )

        with self._manage_session() as session:
            session.add(canonical_collection)
            session.add(collection_version_row)

            return self._row_to_collection_version(
                collection_version_row, CanonicalCollection(collection_id, None, None, None, False)
            )

    def get_collection_version(self, version_id: CollectionVersionId) -> CollectionVersion:
        """
        Retrieves a specific collection version by id
        """
        with self._manage_session() as session:
            collection_version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one_or_none()
            if collection_version is None:
                return None
            collection_id = CollectionId(str(collection_version.collection_id))
            canonical_collection = self.get_canonical_collection(collection_id)
            return self._row_to_collection_version(collection_version, canonical_collection)

    def _get_datasets(self, ids: List[DatasetVersionId], get_tombstoned: bool = False) -> List[DatasetVersion]:
        ids = [dv_id.id for dv_id in ids]
        with self._manage_session() as session:
            versions = session.query(DatasetVersionTable).filter(DatasetVersionTable.id.in_(ids)).all()
            canonical_ids = []
            artifact_ids = []
            for version in versions:
                canonical_ids.append(version.dataset_id)
                artifact_ids.extend(version.artifacts)
            canonical_datasets = (
                session.query(DatasetTable)
                .filter(DatasetTable.id.in_(canonical_ids))
                .filter(DatasetTable.tombstone.is_(get_tombstoned))
                .all()
            )
            canonical_map = {canonical_dataset.id: canonical_dataset for canonical_dataset in canonical_datasets}

            artifacts = session.query(DatasetArtifactTable).filter(DatasetArtifactTable.id.in_(artifact_ids)).all()
            artifact_map = {artifact.id: artifact for artifact in artifacts}

            datasets = []
            for version in versions:
                canonical_dataset_row = canonical_map.get(version.dataset_id)
                if not canonical_dataset_row:
                    continue  # Dataset has the wrong tombstone value
                canonical_dataset = self._row_to_canonical_dataset(canonical_dataset_row)
                version_artifacts = [
                    self._row_to_dataset_artifact(artifact_map.get(artifact_id)) for artifact_id in version.artifacts
                ]
                datasets.append(self._row_to_dataset_version(version, canonical_dataset, version_artifacts))
        return datasets

    def get_collection_version_with_datasets(
        self, version_id: CollectionVersionId, get_tombstoned: bool = False
    ) -> CollectionVersionWithDatasets:
        """
        Retrieves a specific collection version by id, with datasets
        """
        with self._manage_session() as session:
            collection_version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one_or_none()
            if collection_version is None:
                return None
            if not get_tombstoned:
                collection = (
                    session.query(CollectionTable)
                    .filter_by(id=collection_version.collection_id, tombstone=False)
                    .on_or_none()
                )
                if not collection:
                    return None
            collection_id = CollectionId(str(collection_version.collection_id))
            canonical_collection = self.get_canonical_collection(collection_id)
            all_collection_versions_rows = (
                session.query(CollectionVersionTable).filter_by(collection_id=canonical_collection.id.id).all()
            )
            all_collection_versions = [
                self._row_to_collection_version(c_v_row, canonical_collection)
                for c_v_row in all_collection_versions_rows
            ]
            dataset_versions = self._get_datasets([DatasetVersionId(str(id)) for id in collection_version.datasets])
            set_revised_at_field(dataset_versions, all_collection_versions)
            return self._row_to_collection_version_with_datasets(
                collection_version, canonical_collection, dataset_versions
            )

    def get_collection_mapped_version(self, collection_id: CollectionId) -> Optional[CollectionVersionWithDatasets]:
        """
        Retrieves the latest mapped version for a collection
        """
        with self._manage_session() as session:
            version_id = session.query(CollectionTable.version_id).filter_by(id=collection_id.id).one_or_none()
            # TODO: figure out this hack
            if version_id is None or version_id[0] is None:
                return None
            version_id = version_id[0]
            collection_versions = session.query(CollectionVersionTable).filter_by(collection_id=collection_id.id).all()

            collection_version = next(c_v_row for c_v_row in collection_versions if c_v_row.id == version_id)
            canonical_collection = self.get_canonical_collection(collection_id)
            dataset_versions = self._get_datasets([DatasetVersionId(str(id)) for id in collection_version.datasets])
            all_collection_versions = [
                self._row_to_collection_version(c_v_row, canonical_collection) for c_v_row in collection_versions
            ]
            set_revised_at_field(dataset_versions, all_collection_versions)
            return self._row_to_collection_version_with_datasets(
                collection_version, canonical_collection, dataset_versions
            )

    def get_all_versions_for_collection(self, collection_id: CollectionId) -> List[CollectionVersionWithDatasets]:
        """
        Retrieves all versions for a specific collections, without filtering
        """
        with self._manage_session() as session:
            version_rows = session.query(CollectionVersionTable).filter_by(collection_id=collection_id.id).all()
            canonical_collection = self.get_canonical_collection(collection_id)
            versions = list()
            for i in range(len(version_rows)):
                datasets = self._get_datasets([DatasetVersionId(str(id)) for id in version_rows[i].datasets])
                version = self._row_to_collection_version_with_datasets(version_rows[i], canonical_collection, datasets)
                versions.append(version)
            return versions

    def get_all_collections_versions(self, get_tombstoned: bool = False) -> Iterable[CollectionVersion]:
        """
        Retrieves all versions of all collections.
        TODO: for performance reasons, it might be necessary to add a filtering parameter here.
        """
        with self._manage_session() as session:
            versions = session.query(CollectionVersionTable).all()

            # Create a canonical mapping
            if get_tombstoned:
                all_canonical_collections = session.query(CollectionTable).all()
            else:
                all_canonical_collections = (
                    session.query(CollectionTable).filter(CollectionTable.tombstone.isnot(True)).all()
                )
            all_canonical_map = dict()
            for collection_row in all_canonical_collections:
                all_canonical_map[str(collection_row.id)] = CanonicalCollection(
                    CollectionId(str(collection_row.id)),
                    None if collection_row.version_id is None else CollectionVersionId(str(collection_row.version_id)),
                    collection_row.originally_published_at,
                    collection_row.revised_at,
                    collection_row.tombstone,
                )

            result = []
            all_dataset_tombstones = {
                str(dataset.id): dataset.tombstone for dataset in session.query(DatasetTable).all()
            }
            all_dataset_version_mappings = {
                str(dataset_version.id): str(dataset_version.dataset_id)
                for dataset_version in session.query(DatasetVersionTable).all()
            }
            for v in versions:
                include_dataset_version_ids = []
                if str(v.collection_id) in all_canonical_map:
                    for dataset_version_id in v.datasets:
                        dataset_version_id_str = str(dataset_version_id)
                        dataset_id = all_dataset_version_mappings[dataset_version_id_str]
                        if dataset_id and all_dataset_tombstones[dataset_id] == get_tombstoned:
                            include_dataset_version_ids.append(dataset_version_id)
                    v.datasets = include_dataset_version_ids
                    result.append(self._row_to_collection_version(v, all_canonical_map[str(v.collection_id)]))

            return result

    def get_all_mapped_collection_versions(self, get_tombstoned: bool = False) -> Iterable[CollectionVersion]:
        """
        Retrieves all the collection versions that are mapped to a canonical collection.
        """
        with self._manage_session() as session:
            if get_tombstoned:
                canonical_collections = (
                    session.query(CollectionTable).filter(CollectionTable.version_id.isnot(None)).all()
                )  # noqa
            else:
                canonical_collections = (
                    session.query(CollectionTable)
                    .filter(CollectionTable.version_id.isnot(None))
                    .filter_by(tombstone=False)
                    .all()
                )

            mapped_version_ids = {cc.version_id: cc for cc in canonical_collections}
            versions = (
                session.query(CollectionVersionTable)
                .filter(CollectionVersionTable.id.in_(mapped_version_ids.keys()))
                .all()
            )  # noqa

            for version in versions:
                canonical_row = mapped_version_ids[version.id]
                canonical = CanonicalCollection(
                    CollectionId(str(canonical_row.id)),
                    CollectionVersionId(str(canonical_row.version_id)),
                    canonical_row.originally_published_at,
                    canonical_row.revised_at,
                    canonical_row.tombstone,
                )
                yield self._row_to_collection_version(version, canonical)

    def delete_canonical_collection(self, collection_id: CollectionId) -> None:
        """
        Deletes (tombstones) a canonical collection.
        """
        with self._manage_session() as session:
            canonical_collection = session.query(CollectionTable).filter_by(id=collection_id.id).one_or_none()
            if canonical_collection:
                canonical_collection.tombstone = True

    def save_collection_metadata(
        self, version_id: CollectionVersionId, collection_metadata: CollectionMetadata
    ) -> None:
        """
        Saves collection metadata for a collection version
        """
        with self._manage_session() as session:
            version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one()
            version.collection_metadata = collection_metadata.to_json()

    def save_collection_publisher_metadata(
        self, version_id: CollectionVersionId, publisher_metadata: Optional[dict]
    ) -> None:
        """
        Saves publisher metadata for a collection version. Specify None to remove it
        """
        with self._manage_session() as session:
            version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one()
            version.publisher_metadata = json.dumps(publisher_metadata)

    def add_collection_version(self, collection_id: CollectionId) -> CollectionVersionId:
        """
        Adds a collection version to an existing canonical collection. The new version copies all data from
         the previous version except version_id and datetime-based fields (i.e. created_at, published_at)
        Returns the new version id.
        """
        with self._manage_session() as session:
            current_version_id = session.query(CollectionTable.version_id).filter_by(id=collection_id.id).one()[0]
            current_version = session.query(CollectionVersionTable).filter_by(id=current_version_id).one()
            new_version_id = CollectionVersionId()
            new_version = CollectionVersionTable(
                id=new_version_id.id,
                collection_id=collection_id.id,
                collection_metadata=current_version.collection_metadata,
                owner=current_version.owner,
                curator_name=current_version.curator_name,
                publisher_metadata=current_version.publisher_metadata,
                published_at=None,
                created_at=datetime.utcnow(),
                datasets=current_version.datasets,
            )
            session.add(new_version)
            return CollectionVersionId(new_version_id)

    def delete_collection_version(self, version_id: CollectionVersionId) -> None:
        """
        Deletes a collection version, if it is unpublished.
        """
        with self._manage_session() as session:
            version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one_or_none()
            if version:
                if version.published_at:
                    raise CollectionIsPublishedException(f"Published Collection Version {version_id} cannot be deleted")
                session.delete(version)

    def finalize_collection_version(
        self,
        collection_id: CollectionId,
        version_id: CollectionVersionId,
        published_at: Optional[datetime] = None,
        update_revised_at: bool = False,
    ) -> None:
        """
        Finalizes a collection version
        """
        published_at = published_at if published_at else datetime.utcnow()
        with self._manage_session() as session:
            # update canonical collection -> collection version mapping
            collection = session.query(CollectionTable).filter_by(id=collection_id.id).one()
            collection.version_id = version_id.id
            # update canonical collection timestamps depending on whether this is its first publish
            if collection.originally_published_at is None:
                collection.originally_published_at = published_at
            # if not first publish, update revised_at if flagged to do so
            elif update_revised_at:
                collection.revised_at = published_at

            # update collection version
            collection_version = session.query(CollectionVersionTable).filter_by(id=version_id.id).one()
            collection_version.published_at = published_at

            # finalize collection version's dataset versions
            dataset_version_ids = session.query(CollectionVersionTable.datasets).filter_by(id=version_id.id).one()[0]
            for dataset_version, dataset in (
                session.query(DatasetVersionTable, DatasetTable)
                .filter(DatasetVersionTable.dataset_id == DatasetTable.id)
                .filter(DatasetVersionTable.id.in_(dataset_version_ids))
                .all()
            ):
                dataset.version_id = dataset_version.id
                if dataset.published_at is None:
                    dataset.published_at = published_at

    def get_dataset_version(self, dataset_version_id: DatasetVersionId, get_tombstoned: bool = False) -> DatasetVersion:
        """
        Returns a dataset version by id.
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=dataset_version_id.id).one_or_none()
            if dataset_version is None:
                return None
            if not get_tombstoned:
                dataset = (
                    session.query(DatasetTable).filter_by(id=dataset_version.dataset_id, tombstone=False).one_or_none()
                )
                if dataset is None:
                    return None
            return self._hydrate_dataset_version(dataset_version)

    def get_all_versions_for_dataset(self, dataset_id: DatasetId, get_tombstoned: bool = False) -> List[DatasetVersion]:
        """
        Returns all dataset versions for a canonical dataset_id
        """
        dataset = self.get_canonical_dataset(dataset_id)
        if dataset.tombstoned and not get_tombstoned:
            return []
        with self._manage_session() as session:
            dataset_versions = session.query(DatasetVersionTable).filter_by(dataset_id=dataset_id.id).all()
            artifact_ids = [artifact_id for dv in dataset_versions for artifact_id in dv.artifacts]
            artifacts = session.query(DatasetArtifactTable).filter(DatasetArtifactTable.id.in_(artifact_ids)).all()
            artifact_map = {artifact.id: artifact for artifact in artifacts}
            for i in range(len(dataset_versions)):
                version = dataset_versions[i]
                version_artifacts = [
                    self._row_to_dataset_artifact(artifact_map.get(artifact_id)) for artifact_id in version.artifacts
                ]
                dataset_versions[i] = self._row_to_dataset_version(version, dataset, version_artifacts)
            return dataset_versions

    def get_all_mapped_datasets_and_collections(self) -> Tuple[List[DatasetVersion], List[CollectionVersion]]:
        """
        Returns all mapped datasets and mapped collection versions
        """
        active_collections = list(self.get_all_mapped_collection_versions())
        dataset_version_ids = []
        for collection in active_collections:
            dataset_version_ids.extend(collection.datasets)
        return list(self._get_datasets(dataset_version_ids)), active_collections

    def get_dataset_artifacts(self, dataset_artifact_id_list: List[DatasetArtifactId]) -> List[DatasetArtifact]:
        """
        Returns all the artifacts given a list of DatasetArtifactIds
        """
        with self._manage_session() as session:
            artifacts = (
                session.query(DatasetArtifactTable)
                .filter(DatasetArtifactTable.id.in_([str(i) for i in dataset_artifact_id_list]))
                .all()
            )  # noqa
            return [self._row_to_dataset_artifact(a) for a in artifacts]

    def get_dataset_artifacts_by_version_id(self, dataset_version_id: DatasetVersionId) -> List[DatasetArtifact]:
        """
        Returns all the artifacts for a specific dataset version
        """
        with self._manage_session() as session:
            artifact_ids = (
                session.query(DatasetVersionTable.artifacts).filter_by(version_id=dataset_version_id.id).one()
            )
        return self.get_dataset_artifacts(artifact_ids[0])

    def create_canonical_dataset(self, collection_version_id: CollectionVersionId) -> DatasetVersion:
        """
        Initializes a canonical dataset, generating a dataset_id and a dataset_version_id.
        Returns the newly created DatasetVersion.
        """
        with self._manage_session() as session:
            collection_id = (
                session.query(CollectionVersionTable.collection_id).filter_by(id=collection_version_id.id).one()[0]
            )
        dataset_id = DatasetId()
        dataset_version_id = DatasetVersionId()
        canonical_dataset = DatasetTable(id=dataset_id.id, version_id=None, published_at=None)
        dataset_version = DatasetVersionTable(
            id=dataset_version_id.id,
            dataset_id=dataset_id.id,
            collection_id=collection_id,
            dataset_metadata=None,
            artifacts=list(),
            status=DatasetStatus.empty().to_json(),
            created_at=datetime.utcnow(),
        )

        with self._manage_session() as session:
            session.add(canonical_dataset)
            session.add(dataset_version)
            return self._row_to_dataset_version(dataset_version, CanonicalDataset(dataset_id, None, False, None), [])

    def add_dataset_artifact(
        self, version_id: DatasetVersionId, artifact_type: DatasetArtifactType, artifact_uri: str
    ) -> DatasetArtifactId:
        """
        Adds a dataset artifact to an existing dataset version.
        """
        artifact_id = DatasetArtifactId()
        artifact = DatasetArtifactTable(id=artifact_id.id, type=artifact_type, uri=artifact_uri)
        with self._manage_session() as session:
            session.add(artifact)
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            artifacts = list(dataset_version.artifacts)
            artifacts.append(uuid.UUID(artifact_id.id))
            dataset_version.artifacts = artifacts
        return artifact_id

    def update_dataset_artifact(self, artifact_id: DatasetArtifactId, artifact_uri: str) -> None:
        """
        Updates uri for an existing artifact_id
        """
        with self._manage_session() as session:
            artifact = session.query(DatasetArtifactTable).filter_by(id=artifact_id.id).one()
            artifact.uri = artifact_uri

    def update_dataset_processing_status(self, version_id: DatasetVersionId, status: DatasetProcessingStatus) -> None:
        """
        Updates the processing status for a dataset version.
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version_status = json.loads(dataset_version.status)
            dataset_version_status["processing_status"] = status.value
            dataset_version.status = json.dumps(dataset_version_status)

    def update_dataset_validation_status(self, version_id: DatasetVersionId, status: DatasetValidationStatus) -> None:
        """
        Updates the validation status for a dataset version.
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version_status = json.loads(dataset_version.status)
            dataset_version_status["validation_status"] = status.value
            dataset_version.status = json.dumps(dataset_version_status)

    def update_dataset_upload_status(self, version_id: DatasetVersionId, status: DatasetUploadStatus) -> None:
        """
        Updates the upload status for a dataset version.
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version_status = json.loads(dataset_version.status)
            dataset_version_status["upload_status"] = status.value
            dataset_version.status = json.dumps(dataset_version_status)

    def update_dataset_conversion_status(
        self, version_id: DatasetVersionId, status_type: str, status: DatasetConversionStatus
    ) -> None:
        """
        Updates the conversion status for a dataset version and for `status_type`
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version_status = json.loads(dataset_version.status)
            dataset_version_status[status_type] = status.value
            dataset_version.status = json.dumps(dataset_version_status)

    def update_dataset_validation_message(self, version_id: DatasetVersionId, validation_message: str) -> None:
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version_status = json.loads(dataset_version.status)
            dataset_version_status["validation_message"] = validation_message
            dataset_version.status = json.dumps(dataset_version_status)

    def get_dataset_version_status(self, version_id: DatasetVersionId) -> DatasetStatus:
        """
        Returns the status for a dataset version
        """
        with self._manage_session() as session:
            status = session.query(DatasetVersionTable.status).filter_by(id=version_id.id).one()
        return DatasetStatus.from_json(status[0])

    def set_dataset_metadata(self, version_id: DatasetVersionId, metadata: DatasetMetadata) -> None:
        """
        Sets the metadata for a dataset version
        """
        with self._manage_session() as session:
            dataset_version = session.query(DatasetVersionTable).filter_by(id=version_id.id).one()
            dataset_version.dataset_metadata = metadata.to_json()

    def add_dataset_to_collection_version_mapping(
        self, collection_version_id: CollectionVersionId, dataset_version_id: DatasetVersionId
    ) -> None:
        """
        Adds a mapping between an existing collection version and a dataset version
        """
        with self._manage_session() as session:
            collection_version = session.query(CollectionVersionTable).filter_by(id=collection_version_id.id).one()
            # TODO: alternatively use postgres `array_append`
            # TODO: make sure that the UUID conversion works
            updated_datasets = list(collection_version.datasets)
            updated_datasets.append(uuid.UUID(dataset_version_id.id))
            collection_version.datasets = updated_datasets

    def delete_dataset_from_collection_version(
        self, collection_version_id: CollectionVersionId, dataset_version_id: DatasetVersionId
    ) -> None:
        """
        Removes a mapping between a collection version and a dataset version
        """
        with self._manage_session() as session:
            collection_version = session.query(CollectionVersionTable).filter_by(id=collection_version_id.id).one()
            # TODO: alternatively use postgres `array_remove`
            updated_datasets = list(collection_version.datasets)
            updated_datasets.remove(uuid.UUID(dataset_version_id.id))
            collection_version.datasets = updated_datasets

    def replace_dataset_in_collection_version(
        self, collection_version_id: CollectionVersionId, old_dataset_version_id: DatasetVersionId
    ) -> DatasetVersion:
        """
        Replaces an existing mapping between a collection version and a dataset version
        """
        # TODO: this method should probably be split into multiple - it contains too much logic
        with self._manage_session() as session:
            collection_id = (
                session.query(CollectionVersionTable.collection_id).filter_by(id=collection_version_id.id).one()[0]
            )  # noqa
            dataset_id = session.query(DatasetVersionTable.dataset_id).filter_by(id=old_dataset_version_id.id).one()[0]
            new_dataset_version_id = DatasetVersionId()
            new_dataset_version = DatasetVersionTable(
                id=new_dataset_version_id.id,
                dataset_id=dataset_id,
                collection_id=collection_id,
                dataset_metadata=None,
                artifacts=list(),
                status=DatasetStatus.empty().to_json(),
                created_at=datetime.utcnow(),
            )
            session.add(new_dataset_version)

            collection_version = (
                session.query(CollectionVersionTable).filter_by(id=collection_version_id.id).one()
            )  # noqa
            # This replaces the dataset while preserving the order of datasets
            datasets = list(collection_version.datasets)
            idx = next(i for i, e in enumerate(datasets) if str(e) == old_dataset_version_id.id)
            datasets[idx] = uuid.UUID(new_dataset_version_id.id)
            collection_version.datasets = datasets

            return self._hydrate_dataset_version(new_dataset_version)

    def get_dataset_mapped_version(self, dataset_id: DatasetId) -> Optional[DatasetVersion]:
        """
        Returns the dataset version mapped to a canonical dataset_id, or None if not existing
        """
        with self._manage_session() as session:
            canonical_dataset = session.query(DatasetTable).filter_by(id=dataset_id.id).one_or_none()
            if canonical_dataset is None:
                return None
            if canonical_dataset.version_id is None:
                return None
            dataset_version = session.query(DatasetVersionTable).filter_by(id=canonical_dataset.version_id).one()
            dataset_version.canonical_dataset = canonical_dataset
            return self._hydrate_dataset_version(dataset_version)
