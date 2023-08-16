import json
import logging
from pathlib import Path

from backend.layers.common.entities import CollectionVersionId, DatasetId

logger = logging.getLogger(__name__)


def rollback_dataset(ctx, report_path: Path):
    with report_path.open("r") as f:
        report = json.load(f)
    for entry in report:
        if entry["rollback"] is True:
            collection_version_id = entry["collection_version_id"]
            dataset_id = entry["dataset_id"]
            ctx.obj["business_logic"].restore_previous_dataset_version(
                CollectionVersionId(collection_version_id), DatasetId(dataset_id)
            )


def publish_migrated_collection(ctx, report_path: Path):
    """
    :param report_path:
    :return:
    """
    bl = ctx.obj["business_logic"]

    with report_path.open("r") as f:
        report = json.load(f)
    for entry in report:
        try:
            if True:  # Need to add a filter to the report to only publish collections that failed
                # publish_collection_version
                bl.publish_collection_version(CollectionVersionId(entry["collection_version_id"]))
        except Exception:
            logger.exception("Error publishing collection: %s", entry)
        # clean up all */migrate.h5ad from s3.
