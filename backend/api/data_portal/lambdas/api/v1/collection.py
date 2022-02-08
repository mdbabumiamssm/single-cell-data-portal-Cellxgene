import sqlalchemy
from typing import Optional

from backend.api.db import dbconnect
from ....common.providers import crossref_provider
from backend.api.data_portal.common.providers.crossref_provider import CrossrefException

from flask import make_response, jsonify, g

import logging

from ....common.corpora_orm import DbCollection, CollectionVisibility
from ....common.entities import Collection
from ....common.utils.exceptions import ForbiddenHTTPException, ConflictException
from backend.api.data_portal.lambdas.api.v1.authorization import has_scope


def _is_user_owner_or_allowed(user, owner):
    """
    Check if the user has ownership on a collection, or if it has superuser permissions
    """
    return (user and user == owner) or (has_scope("write:collections"))


def _owner_or_allowed(user):
    """
    Returns None if the user is superuser, `user` otherwise. Used for where conditions
    """
    return None if has_scope("write:collections") else user


def _get_doi_from_body(body):
    links = body.get("links", [])
    doi_list = [link["link_url"] for link in links if link["link_type"] == "DOI"]
    # TODO (ebezzi): remove DOI normalization when all DOIs have been migrated to CURIE
    return Collection._normalize_doi(doi_list[0]) if doi_list else None


@dbconnect
def get_collections_list(from_date: int = None, to_date: int = None, user: Optional[str] = None):
    db_session = g.db_session
    all_collections = Collection.list_attributes_in_time_range(
        db_session,
        from_date=from_date,
        to_date=to_date,
        list_attributes=[DbCollection.id, DbCollection.visibility, DbCollection.owner, DbCollection.created_at],
    )

    collections = []
    for coll_dict in all_collections:
        visibility = coll_dict["visibility"]
        owner = coll_dict["owner"]
        if visibility == CollectionVisibility.PUBLIC or _is_user_owner_or_allowed(user, owner):
            collections.append(dict(id=coll_dict["id"], created_at=coll_dict["created_at"], visibility=visibility.name))

    result = {"collections": collections}
    if from_date:
        result["from_date"] = from_date
    if to_date:
        result["to_date"] = to_date

    return make_response(jsonify(result), 200)


@dbconnect
def get_collection_details(collection_uuid: str, visibility: str, user: str):
    db_session = g.db_session
    collection = Collection.get_collection(db_session, collection_uuid, visibility, include_tombstones=True)
    if not collection:
        raise ForbiddenHTTPException()
    if collection.tombstone and visibility == CollectionVisibility.PUBLIC.name:
        result = ""
        response = 410
    else:
        get_tombstone_datasets = (
            _is_user_owner_or_allowed(user, collection.owner) and collection.visibility == CollectionVisibility.PRIVATE
        )
        result = collection.reshape_for_api(get_tombstone_datasets)
        response = 200
        result["access_type"] = "WRITE" if _is_user_owner_or_allowed(user, collection.owner) else "READ"
    return make_response(jsonify(result), response)


@dbconnect
def get_collections_index():
    # TODO (ebezzi): this is very similar to `get_collections_list` above. Eventually they should be consolidated
    db_session = g.db_session

    filtered_collection = Collection.list_attributes_in_time_range(
        db_session,
        filters=[DbCollection.visibility == CollectionVisibility.PUBLIC],
        list_attributes=[
            DbCollection.id,
            DbCollection.name,
            DbCollection.published_at,
            DbCollection.revised_at,
            DbCollection.publisher_metadata,
        ],
    )

    return make_response(jsonify(filtered_collection), 200)


@dbconnect
def post_collection_revision(collection_uuid: str, user: str):
    db_session = g.db_session
    collection = Collection.get_collection(
        db_session,
        collection_uuid,
        CollectionVisibility.PUBLIC.name,
        owner=_owner_or_allowed(user),
    )
    if not collection:
        raise ForbiddenHTTPException()
    try:
        collection_revision = collection.revision()
    except sqlalchemy.exc.IntegrityError as ex:
        db_session.rollback()
        raise ConflictException() from ex
    result = collection_revision.reshape_for_api()

    result["access_type"] = "WRITE"
    return make_response(jsonify(result), 201)


@dbconnect
def create_collection(body: object, user: str):
    db_session = g.db_session

    provider = crossref_provider.CrossrefProvider()
    try:
        publisher_metadata = provider.fetch_metadata(_get_doi_from_body(body))
    except CrossrefException as e:
        logging.warning(f"CrossrefException on create_collection: {e}. Will ignore metadata.")
        publisher_metadata = None

    collection = Collection.create(
        db_session,
        visibility=CollectionVisibility.PRIVATE,
        name=body["name"],
        description=body["description"],
        owner=user,
        links=body.get("links", []),
        contact_name=body["contact_name"],
        contact_email=body["contact_email"],
        curator_name=body.get("curator_name", ""),
        publisher_metadata=publisher_metadata,
    )

    return make_response(jsonify({"collection_uuid": collection.id}), 201)


def get_collection_dataset(dataset_uuid: str):
    raise NotImplementedError


@dbconnect
def delete_collection(collection_uuid: str, visibility: str, user: str):
    db_session = g.db_session
    if visibility == CollectionVisibility.PUBLIC.name:
        pub_collection = Collection.get_collection(
            db_session,
            collection_uuid,
            visibility,
            owner=_owner_or_allowed(user),
            include_tombstones=True,
        )
        priv_collection = Collection.get_collection(
            db_session,
            collection_uuid,
            CollectionVisibility.PRIVATE.name,
            owner=_owner_or_allowed(user),
            include_tombstones=True,
        )

        if pub_collection:
            if not pub_collection.tombstone:
                pub_collection.tombstone_collection()
            if priv_collection:
                if not priv_collection.tombstone:
                    priv_collection.delete()
            return "", 204
    else:
        priv_collection = Collection.get_collection(
            db_session,
            collection_uuid,
            CollectionVisibility.PRIVATE.name,
            owner=_owner_or_allowed(user),
            include_tombstones=True,
        )
        if priv_collection:
            if not priv_collection.tombstone:
                priv_collection.delete()
            return "", 204
    return "", 403


@dbconnect
def update_collection(collection_uuid: str, body: dict, user: str):
    db_session = g.db_session
    collection = Collection.get_collection(
        db_session,
        collection_uuid,
        CollectionVisibility.PRIVATE.name,
        owner=_owner_or_allowed(user),
    )
    if not collection:
        raise ForbiddenHTTPException()

    # Compute the diff between old and new DOI
    old_doi = collection.get_normalized_doi()
    new_doi = _get_doi_from_body(body)

    if old_doi and not new_doi:
        # If the DOI was deleted, remove the publisher_metadata field
        collection.update(publisher_metadata=None)
    elif new_doi != old_doi:
        # If the DOI has changed, fetch and update the metadata
        provider = crossref_provider.CrossrefProvider()
        try:
            publisher_metadata = provider.fetch_metadata(new_doi)
        except CrossrefException as e:
            logging.warning(f"CrossrefException on update_collection: {e}. Will ignore metadata.")
            publisher_metadata = None
        body["publisher_metadata"] = publisher_metadata

    collection.update(**body)
    result = collection.reshape_for_api(tombstoned_datasets=True)
    result["access_type"] = "WRITE"
    return make_response(jsonify(result), 200)
