import logging

from backend.cellguide.pipeline.canonical_marker_genes.canonical_markers import CanonicalMarkerGenesCompiler
from backend.cellguide.pipeline.constants import (
    CANONICAL_MARKER_GENES_FOLDERNAME,
    HOMO_SAPIENS_ORGANISM_ONTOLOGY_TERM_ID,
)
from backend.cellguide.pipeline.ontology_tree import get_ontology_tree_builder
from backend.cellguide.pipeline.ontology_tree.tree_builder import OntologyTreeBuilder
from backend.cellguide.pipeline.utils import output_json_per_key
from backend.wmg.api.wmg_api_config import WMG_API_SNAPSHOT_SCHEMA_VERSION
from backend.wmg.data.snapshot import WmgSnapshot, load_snapshot

logger = logging.getLogger(__name__)


def run(*, output_directory: str):
    snapshot = load_snapshot(snapshot_schema_version=WMG_API_SNAPSHOT_SCHEMA_VERSION)
    ontology_tree = get_ontology_tree_builder(snapshot=snapshot)
    data = get_canonical_marker_genes(snapshot=snapshot, ontology_tree=ontology_tree)
    output_json_per_key(data, f"{output_directory}/{CANONICAL_MARKER_GENES_FOLDERNAME}")


def get_canonical_marker_genes(*, snapshot: WmgSnapshot, ontology_tree: OntologyTreeBuilder) -> dict:
    wmg_tissues = [
        next(iter(i.keys()))
        for i in snapshot.primary_filter_dimensions["tissue_terms"][HOMO_SAPIENS_ORGANISM_ONTOLOGY_TERM_ID]
    ]
    wmg_human_genes = [
        next(iter(i.values()))
        for i in snapshot.primary_filter_dimensions["gene_terms"][HOMO_SAPIENS_ORGANISM_ONTOLOGY_TERM_ID]
    ]
    marker_gene_compiler = CanonicalMarkerGenesCompiler(wmg_tissues=wmg_tissues, wmg_human_genes=wmg_human_genes)
    parsed_asctb_table_entries = marker_gene_compiler.get_processed_asctb_table_entries()

    num_cell_types_in_corpus = len(
        set(parsed_asctb_table_entries).intersection(ontology_tree.all_cell_type_ids_in_corpus)
    )
    logger.info(
        f"Parsed {len(parsed_asctb_table_entries)} cell types in ASCTB, out of which {num_cell_types_in_corpus} are in CellGuide."
    )
    return parsed_asctb_table_entries
