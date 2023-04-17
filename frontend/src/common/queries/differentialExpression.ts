import { useContext, useMemo } from "react";
import { useQuery, UseQueryResult } from "react-query";
import { API_URL } from "src/configs/dev";
import {
  DispatchContext,
  StateContext,
} from "src/views/DifferentialExpression/common/store";
import { setSnapshotId } from "src/views/DifferentialExpression/common/store/actions";
import { Filters } from "src/views/DifferentialExpression/common/store/reducer";
import { Organism as IOrganism } from "src/views/DifferentialExpression/common/types";
import { API } from "../API";
import { ROUTES } from "../constants/routes";
import { DEFAULT_FETCH_OPTIONS, JSON_BODY_FETCH_OPTIONS } from "./common";
import { ENTITIES } from "./entities";
import { QueryGroup } from "src/views/DifferentialExpression/common/store/reducer";

interface RawOntologyTerm {
  [id: string]: string;
}

interface RawOntologyTermsByOrganism {
  [organismId: string]: Array<RawOntologyTerm>;
}
export interface RawPrimaryFilterDimensionsResponse {
  gene_terms: RawOntologyTermsByOrganism;
  organism_terms: Array<RawOntologyTerm>;
  snapshot_id: string;
  tissue_terms: RawOntologyTermsByOrganism;
}

export interface OntologyTerm {
  id: string;
  name: string;
}
interface OntologyTermsByOrganism {
  [organismID: string]: Array<OntologyTerm>;
}

export interface PrimaryFilterDimensionsResponse {
  genes: OntologyTermsByOrganism;
  organisms: Array<OntologyTerm>;
  snapshotId: string;
  tissues: OntologyTermsByOrganism;
}

export async function fetchPrimaryFilterDimensions(): Promise<PrimaryFilterDimensionsResponse> {
  const url = API_URL + API.WMG_PRIMARY_FILTER_DIMENSIONS;

  const response: RawPrimaryFilterDimensionsResponse = await (
    await fetch(url, DEFAULT_FETCH_OPTIONS)
  ).json();

  return transformPrimaryFilterDimensions(response);
}

function flattenOntologyTermsByOrganism(
  termsObject: RawOntologyTermsByOrganism
): OntologyTermsByOrganism {
  return Object.entries(termsObject).reduce((memo, [organismId, genes]) => {
    memo[organismId] = genes.map(toEntity);
    return memo;
  }, {} as OntologyTermsByOrganism);
}

export function generateTermsByKey(
  flattenedTerms: OntologyTermsByOrganism,
  key: keyof OntologyTerm
): {
  [key: string]: OntologyTerm;
} {
  const termsByKey: { [key: string]: OntologyTerm } = {};

  Object.values(flattenedTerms).forEach((terms) => {
    for (const term of terms) {
      termsByKey[term[key]] = term;
    }
  });

  return termsByKey;
}

function transformPrimaryFilterDimensions(
  response: RawPrimaryFilterDimensionsResponse
): PrimaryFilterDimensionsResponse {
  const { gene_terms, organism_terms, snapshot_id, tissue_terms } = response;

  return {
    genes: flattenOntologyTermsByOrganism(gene_terms),
    organisms: organism_terms.map(toEntity),
    snapshotId: snapshot_id,
    tissues: flattenOntologyTermsByOrganism(tissue_terms),
  };
}

export const USE_PRIMARY_FILTER_DIMENSIONS = {
  entities: [ENTITIES.WMG_PRIMARY_FILTER_DIMENSIONS],
  id: "wmg-primaryFilterDimensions",
};

export function usePrimaryFilterDimensions(): UseQueryResult<PrimaryFilterDimensionsResponse> {
  const dispatch = useContext(DispatchContext);

  // (thuang): Refresh query when the snapshotId changes
  const currentSnapshotId = useSnapshotId();

  return useQuery<PrimaryFilterDimensionsResponse>(
    [USE_PRIMARY_FILTER_DIMENSIONS, currentSnapshotId],
    fetchPrimaryFilterDimensions,
    {
      onSuccess(response) {
        if (!response || !dispatch) return;

        const { snapshotId } = response;

        if (currentSnapshotId !== snapshotId) {
          dispatch(setSnapshotId(snapshotId));
        }
      },
      // (thuang): We don't need to refetch during the session
      staleTime: Infinity,
    }
  );
}

const TEMP_ALLOW_NAME_LIST = ["Homo sapiens", "Mus musculus"];

export function useAvailableOrganisms() {
  const { data, isLoading } = usePrimaryFilterDimensions();

  if (isLoading) {
    return { isLoading, data: null };
  }

  return {
    isLoading,
    data: data?.organisms.filter((organism: IOrganism) =>
      TEMP_ALLOW_NAME_LIST.includes(organism.name)
    ),
  };
}

interface FilterSecondary {
  organism_ontology_term_id: string;
  tissue_ontology_term_ids: string[];
  dataset_ids: string[];
  disease_ontology_term_ids: string[];
  sex_ontology_term_ids: string[];
  development_stage_ontology_term_ids: string[];
  self_reported_ethnicity_ontology_term_ids: string[];
  cell_type_ontology_term_ids: string[];
}

export interface FiltersQuery {
  filter: FilterSecondary;
}

export interface DifferentialExpressionQuery {
  contextFilters: FilterSecondary;
  queryGroupFilters: {
    dataset_ids: string[];
    development_stage_ontology_term_ids: string[];
    disease_ontology_term_ids: string[];
    organism_ontology_term_id: string;
    self_reported_ethnicity_ontology_term_ids: string[];
    sex_ontology_term_ids: string[];
    tissue_ontology_term_ids: string[];
    cell_type_ontology_term_ids: string[];
  }[];
}

interface FiltersQueryResponse {
  filter_dims: {
    datasets: {
      collection_id: string;
      collection_label: string;
      id: string;
      label: string;
    }[];
    disease_terms: { [id: string]: string }[];
    sex_terms: { [id: string]: string }[];
    development_stage_terms: { [id: string]: string }[];
    self_reported_ethnicity_terms: { [id: string]: string }[];
    tissue_terms: { [id: string]: string }[];
    cell_type_terms: { [id: string]: string }[];
  };
  snapshot_id: string;
}

export interface DifferentialExpressionResult {
  gene_ontology_term_id: string;
  p_value: number;
  effect_size: number;
}
interface DifferentialExpressionQueryResponse {
  differentialExpressionResults: DifferentialExpressionResult[][];
  snapshot_id: string;
}

async function fetchFiltersQuery({
  query,
  signal,
}: {
  query: FiltersQuery | null;
  signal?: AbortSignal;
}): Promise<FiltersQueryResponse | undefined> {
  if (!query) return;

  const url = API_URL + API.WMG_FILTERS_QUERY;

  const response = await fetch(url, {
    ...DEFAULT_FETCH_OPTIONS,
    ...JSON_BODY_FETCH_OPTIONS,
    body: JSON.stringify(query),
    method: "POST",
    signal,
  });
  const json: FiltersQueryResponse = await response.json();

  if (!response.ok) {
    throw json;
  }

  return json;
}

export const USE_FILTERS_QUERY = {
  entities: [ENTITIES.WMG_FILTERS_QUERY],
  id: "de-filters-query",
};

async function fetchDifferentialExpressionQuery({
  query,
  signal,
}: {
  query: DifferentialExpressionQuery | null;
  signal?: AbortSignal;
}): Promise<DifferentialExpressionQueryResponse | undefined> {
  if (!query) return;

  const url = API_URL + API.DE_QUERY;

  const response = await fetch(url, {
    ...DEFAULT_FETCH_OPTIONS,
    ...JSON_BODY_FETCH_OPTIONS,
    body: JSON.stringify(query),
    method: "POST",
    signal,
  });
  const json: DifferentialExpressionQueryResponse = await response.json();

  if (!response.ok) {
    throw json;
  }

  return json;
}

export const USE_DE_QUERY = {
  entities: [ENTITIES.DE_QUERY],
  id: "de-query",
};

export function useWMGFiltersQuery(
  query: FiltersQuery | null
): UseQueryResult<FiltersQueryResponse> {
  const dispatch = useContext(DispatchContext);

  // (thuang): Refresh query when the snapshotId changes
  const currentSnapshotId = useSnapshotId();

  return useQuery(
    [USE_FILTERS_QUERY, query, currentSnapshotId],
    ({ signal }) => fetchFiltersQuery({ query, signal }),
    {
      enabled: Boolean(query),
      onSuccess(response) {
        if (!response || !dispatch) return;

        const { snapshot_id } = response;

        if (currentSnapshotId !== snapshot_id) {
          dispatch(setSnapshotId(snapshot_id));
        }
      },
      // (thuang): We don't need to refetch during the session
      staleTime: Infinity,
    }
  );
}

export function useDEQuery(
  query: DifferentialExpressionQuery | null
): UseQueryResult<DifferentialExpressionQueryResponse> {
  const dispatch = useContext(DispatchContext);

  // (thuang): Refresh query when the snapshotId changes
  const currentSnapshotId = useSnapshotId();

  return useQuery(
    [USE_DE_QUERY, query, currentSnapshotId],
    ({ signal }) => fetchDifferentialExpressionQuery({ query, signal }),
    {
      enabled: Boolean(query),
      onSuccess(response) {
        if (!response || !dispatch) return;

        const { snapshot_id } = response;

        if (currentSnapshotId !== snapshot_id) {
          dispatch(setSnapshotId(snapshot_id));
        }
      },
      // (thuang): We don't need to refetch during the session
      staleTime: Infinity,
    }
  );
}

const EMPTY_FILTER_DIMENSIONS = {
  datasets: [],
  development_stage_terms: [],
  disease_terms: [],
  self_reported_ethnicity_terms: [],
  sex_terms: [],
  tissue_terms: [],
  cell_type_terms: [],
};

export interface RawDataset {
  collection_id: string;
  collection_label: string;
  id: string;
  label: string;
}

export interface FilterDimensions {
  datasets: RawDataset[];
  development_stage_terms: { id: string; name: string }[];
  disease_terms: { id: string; name: string }[];
  self_reported_ethnicity_terms: { id: string; name: string }[];
  sex_terms: { id: string; name: string }[];
  tissue_terms: { id: string; name: string }[];
  cell_type_terms: { id: string; name: string }[];
}

export function useFilterDimensions(): {
  data: FilterDimensions;
  isLoading: boolean;
} {
  const { organismId } = useContext(StateContext);
  const requestBody = useWMGFiltersQueryRequestBody();
  const { data, isLoading } = useWMGFiltersQuery(requestBody);
  const { data: primaryFilterDimensions } = usePrimaryFilterDimensions();

  return useMemo(() => {
    if (isLoading || !data || !primaryFilterDimensions || !organismId)
      return { data: EMPTY_FILTER_DIMENSIONS, isLoading };

    const {
      tissues: { [organismId]: allOrganismTissues },
    } = primaryFilterDimensions;

    if (!allOrganismTissues)
      return { data: EMPTY_FILTER_DIMENSIONS, isLoading };

    const { filter_dims } = data;

    const {
      datasets,
      development_stage_terms,
      disease_terms,
      self_reported_ethnicity_terms,
      sex_terms,
      tissue_terms,
      cell_type_terms,
    } = filter_dims;

    const sortedDatasets = Object.values(
      aggregateCollectionsFromDatasets(datasets)
    ).flatMap(({ datasets }) => datasets);

    const allOrganismTissueIds = allOrganismTissues.map((tissue) => tissue.id);
    const filtered_tissue_terms = tissue_terms.filter((tissue) =>
      allOrganismTissueIds.includes(Object.keys(tissue)[0])
    );

    return {
      data: {
        datasets: sortedDatasets.map((dataset) => ({
          ...dataset,
          name: dataset.label,
        })),
        development_stage_terms: development_stage_terms.map(toEntity),
        disease_terms: disease_terms.map(toEntity),
        self_reported_ethnicity_terms:
          self_reported_ethnicity_terms.map(toEntity),
        sex_terms: sex_terms.map(toEntity),
        tissue_terms: filtered_tissue_terms.map(toEntity),
        cell_type_terms: cell_type_terms.map(toEntity),
      },
      isLoading: false,
    };
  }, [data, isLoading, primaryFilterDimensions, organismId]);
}

function useWMGFiltersQueryRequestBody() {
  const { organismId, selectedFilters } = useContext(StateContext);

  const {
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    cellTypes,
  } = selectedFilters;

  return useMemo(() => {
    if (!organismId) {
      return null;
    }

    return {
      filter: {
        dataset_ids: datasets,
        development_stage_ontology_term_ids: developmentStages,
        disease_ontology_term_ids: diseases,
        organism_ontology_term_id: organismId,
        self_reported_ethnicity_ontology_term_ids: ethnicities,
        sex_ontology_term_ids: sexes,
        tissue_ontology_term_ids: tissues,
        cell_type_ontology_term_ids: cellTypes,
      },
    };
  }, [
    organismId,
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    cellTypes,
  ]);
}

export function useDifferentialExpression(): {
  data: DifferentialExpressionResult[][];
  isLoading: boolean;
} {
  const requestBody = useDEQueryRequestBody();
  const { data, isLoading } = useDEQuery(requestBody);

  return useMemo(() => {
    if (isLoading || !data) return { data: [[]], isLoading };
    return {
      data: data.differentialExpressionResults,
      isLoading: false,
    };
  }, [data, isLoading]);
}

function useDEQueryRequestBody() {
  const { organismId, selectedFilters, queryGroups } = useContext(StateContext);

  const {
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    cellTypes,
  } = selectedFilters;

  return useMemo(() => {
    if (!organismId || !queryGroups) {
      return null;
    }

    return {
      contextFilters: {
        dataset_ids: datasets,
        development_stage_ontology_term_ids: developmentStages,
        disease_ontology_term_ids: diseases,
        organism_ontology_term_id: organismId,
        self_reported_ethnicity_ontology_term_ids: ethnicities,
        sex_ontology_term_ids: sexes,
        tissue_ontology_term_ids: tissues,
        cell_type_ontology_term_ids: cellTypes,
      },
      queryGroupFilters: queryGroups.map((queryGroup) => ({
        dataset_ids: queryGroup.datasets,
        development_stage_ontology_term_ids: queryGroup.developmentStages,
        disease_ontology_term_ids: queryGroup.diseases,
        organism_ontology_term_id: organismId,
        self_reported_ethnicity_ontology_term_ids: queryGroup.ethnicities,
        sex_ontology_term_ids: queryGroup.sexes,
        tissue_ontology_term_ids: queryGroup.tissues,
        cell_type_ontology_term_ids: queryGroup.cellTypes,
      })),
    };
  }, [
    organismId,
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    queryGroups,
  ]);
}

// This hook is for the QueryGroupFilters
export function useQueryGroupFilterDimensions(
  queryGroup: QueryGroup,
  availableFilters: Partial<FilterDimensions>
): {
  data: FilterDimensions;
  isLoading: boolean;
} {
  const { organismId } = useContext(StateContext);
  const requestBody = useWMGFiltersQueryRequestBodyForQueryGroups(
    queryGroup,
    availableFilters as FilterDimensions
  );
  const { data, isLoading } = useWMGFiltersQuery(requestBody);
  const { data: primaryFilterDimensions } = usePrimaryFilterDimensions();

  return useMemo(() => {
    if (isLoading || !data || !primaryFilterDimensions || !organismId)
      return { data: EMPTY_FILTER_DIMENSIONS, isLoading };

    const {
      tissues: { [organismId]: allOrganismTissues },
    } = primaryFilterDimensions;

    if (!allOrganismTissues)
      return { data: EMPTY_FILTER_DIMENSIONS, isLoading };

    const { filter_dims } = data;

    const {
      datasets,
      development_stage_terms,
      disease_terms,
      self_reported_ethnicity_terms,
      sex_terms,
      tissue_terms,
      cell_type_terms,
    } = filter_dims;

    const sortedDatasets = Object.values(
      aggregateCollectionsFromDatasets(datasets)
    ).flatMap(({ datasets }) => datasets);

    const allOrganismTissueIds = allOrganismTissues.map((tissue) => tissue.id);
    const filtered_tissue_terms = tissue_terms.filter((tissue) =>
      allOrganismTissueIds.includes(Object.keys(tissue)[0])
    );

    return {
      data: {
        datasets: sortedDatasets.map((dataset) => ({
          ...dataset,
          name: dataset.label,
        })),
        development_stage_terms: development_stage_terms.map(toEntity),
        disease_terms: disease_terms.map(toEntity),
        self_reported_ethnicity_terms:
          self_reported_ethnicity_terms.map(toEntity),
        sex_terms: sex_terms.map(toEntity),
        tissue_terms: filtered_tissue_terms.map(toEntity),
        cell_type_terms: cell_type_terms.map(toEntity),
      },
      isLoading: false,
    };
  }, [data, isLoading, primaryFilterDimensions, organismId]);
}

function useWMGFiltersQueryRequestBodyForQueryGroups(
  queryGroup: QueryGroup,
  availableFilters: FilterDimensions
) {
  const { organismId, selectedFilters } = useContext(StateContext);

  const keyNameMapping = {
    tissues: "tissue_terms",
    cellTypes: "cell_type_terms",
    developmentStages: "development_stage_terms",
    diseases: "disease_terms",
    sexes: "sex_terms",
    datasets: "datasets",
    ethnicities: "self_reported_ethnicity_terms",
  };

  let filters;

  filters = { ...queryGroup };
  for (const key in filters) {
    if (filters[key as keyof Filters].length === 0) {
      const mappedKey = keyNameMapping[key as keyof Filters];
      let availableFilterIds: string[] = [];
      if (mappedKey in availableFilters) {
        availableFilterIds = availableFilters[
          mappedKey as keyof FilterDimensions
        ].map((filter) => filter.id);
      }
      filters[key as keyof Filters] = selectedFilters[
        key as keyof Filters
      ].filter((value) => availableFilterIds.includes(value));
    }
  }

  const {
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    cellTypes,
  } = filters;

  return useMemo(() => {
    if (!organismId) {
      return null;
    }

    return {
      filter: {
        dataset_ids: datasets,
        development_stage_ontology_term_ids: developmentStages,
        disease_ontology_term_ids: diseases,
        organism_ontology_term_id: organismId,
        self_reported_ethnicity_ontology_term_ids: ethnicities,
        sex_ontology_term_ids: sexes,
        tissue_ontology_term_ids: tissues,
        cell_type_ontology_term_ids: cellTypes,
      },
    };
  }, [
    organismId,
    datasets,
    developmentStages,
    diseases,
    ethnicities,
    sexes,
    tissues,
    cellTypes,
  ]);
}

function toEntity(item: RawOntologyTerm) {
  const [id, name] = Object.entries(item)[0];

  return { id, name: name || id || "" };
}

function useSnapshotId(): string | null {
  const state = useContext(StateContext);

  const { snapshotId } = state;

  return snapshotId || null;
}

interface Dataset extends RawDataset {
  id: string;
  label: string;
}

export interface CollectionFromDatasets {
  name: string;
  url: string;
  datasets: Dataset[];
}

export interface CollectionsFromDatasets {
  [name: string]: CollectionFromDatasets;
}

export function aggregateCollectionsFromDatasets(
  datasets: FilterDimensions["datasets"]
): CollectionsFromDatasets {
  const collections: CollectionsFromDatasets = {};

  for (const dataset of datasets) {
    const { collection_label, collection_id, id, label } = dataset;

    if (!collections[collection_label]) {
      collections[collection_label] = {
        datasets: [],
        name: collection_label,
        url: ROUTES.COLLECTION.replace(":id", collection_id),
      };
    }

    collections[collection_label].datasets.push({ ...dataset, id, label });
  }

  for (const collection of Object.values(collections)) {
    collection.datasets.sort((a, b) => {
      return a.label.localeCompare(b.label);
    });
  }

  return collections;
}
