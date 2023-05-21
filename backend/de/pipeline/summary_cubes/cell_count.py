import json
import logging

import numpy as np
import pandas as pd
import tiledb

from backend.wmg.data.schemas.corpus_schema import (
    FILTER_RELATIONSHIPS_NAME,
    OBS_ARRAY_NAME,
)
from backend.wmg.data.schemas.cube_schema import cell_counts_schema
from backend.wmg.data.snapshot import CELL_COUNTS_CUBE_NAME
from backend.wmg.data.utils import create_empty_cube, log_func_runtime, to_dict

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def extract(corpus_path: str) -> pd.DataFrame:
    """
    get obs data from integrated corpus
    """
    return tiledb.open(f"{corpus_path}/{OBS_ARRAY_NAME}")


def transform(obs: pd.DataFrame) -> pd.DataFrame:
    """
    Create cell count cube data frame by grouping data in the
    integrated corpus obs arrays on relevant features
    """
    df = (
        obs.df[:]
        .groupby(
            by=[
                "dataset_id",
                "cell_type_ontology_term_id",
                "tissue_ontology_term_id",
                "tissue_original_ontology_term_id",
                "assay_ontology_term_id",
                "development_stage_ontology_term_id",
                "disease_ontology_term_id",
                "self_reported_ethnicity_ontology_term_id",
                "sex_ontology_term_id",
                "organism_ontology_term_id",
            ],
            as_index=False,
        )
        .size()
    ).rename(columns={"size": "n_cells"})
    return df


def load(corpus_path: str, df: pd.DataFrame) -> str:
    """
    write cell count cube to disk
    """
    uri = f"{corpus_path}/{CELL_COUNTS_CUBE_NAME}"
    create_empty_cube(uri, cell_counts_schema)
    tiledb.from_pandas(uri, df, mode="append")
    return uri


@log_func_runtime
def create_cell_count_cube(corpus_path: str):
    """
    Create cell count cube and write to disk
    """
    obs = extract(corpus_path)
    df = transform(obs)

    n_cells = df["n_cells"].to_numpy()
    df["n_cells"] = n_cells

    filter_relationships_linked_list = create_filter_relationships_graph(df)

    with open(f"{corpus_path}/{FILTER_RELATIONSHIPS_NAME}.json", "w") as f:
        json.dump(filter_relationships_linked_list, f)

    uri = load(corpus_path, df)
    cell_count = df.n_cells.sum()
    logger.info(f"{cell_count=}")
    logger.info(f"Cell count cube created and stored at {uri}")


def create_filter_relationships_graph(df: pd.DataFrame) -> dict:
    """
    Create a graph of filter relationships

    Arguments
    ---------
    df: pd.DataFrame
        Dataframe containing the filter combinations per cell

    Returns
    -------
    filter_relationships_hash_table: dict
        A dictionary containing the filter relationships for each unique filter value.
        Filter values are their column name + __ + their value (e.g. "dataset_id__Single cell transcriptome analysis of human pancreas").
        The dictionary values are lists of filter values that are related to the key filter value. Relatedness indicates that these filters
        are co-occuring in at least one cell.
    """
    # get a dataframe of the columns that are not numeric
    df_filters = df.select_dtypes(exclude="number")
    # get a numpy array of the column names with shape (1, n_cols)
    cols = df_filters.columns.values[None, :]

    # tile the column names row-wise to match the shape of the dataframe and concatenate to the values
    # this ensures that filter values will never collide across columns.
    mat = np.tile(cols, (df.shape[0], 1)) + "__" + df_filters.values

    # for each cell, get all pairwise combinations of filters compresent in that cell
    # these are the edges of the filter relationships graph
    Xs = []
    Ys = []
    for i in range(mat.shape[0]):
        Xs.extend(np.repeat(mat[i], mat[i].size))
        Ys.extend(np.tile(mat[i], mat[i].size))

    # get all the unique combinations of filters
    Xs, Ys = np.unique(np.array((Xs, Ys)), axis=1)

    # exclude self-relationships
    filt = Xs != Ys
    Xs, Ys = Xs[filt], Ys[filt]

    # convert the edges to a linked list representation
    filter_relationships_linked_list = to_dict(Xs, Ys)

    # reorganize the linked list representation to a nested linked list representation
    # where the filter columns are separated into distinct dictionaries
    # e.g. instead of {"cell_type_ontology_term_id__beta cell": ["dataset_id__Single cell transcriptome analysis of human pancreas", "assay_ontology_term_id__assay_type", ...], ...},
    # it's now {"cell_type_ontology_term_id__beta cell": {"dataset_id": ["dataset_id__Single cell transcriptome analysis of human pancreas", ...], "assay_ontology_term_id": ["assay_ontology_term_id__assay_type", ...], ...}, ...}.
    # This structure is easier to parse by the `/query` endpoint.
    for k, v in filter_relationships_linked_list.items():
        filter_relationships_linked_list[k] = to_dict([x.split("__")[0] for x in v], v)

    return filter_relationships_linked_list
