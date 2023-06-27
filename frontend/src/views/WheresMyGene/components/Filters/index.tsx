import { createFilterOptions } from "@mui/material";
import {
  ComplexFilterInputDropdown,
  DefaultMenuSelectOption,
  InputDropdownProps,
} from "@czi-sds/components";
import isEqual from "lodash/isEqual";
import {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { track } from "src/common/analytics";
import { EVENTS } from "src/common/analytics/events";
import { EMPTY_ARRAY } from "src/common/constants/utils";
import {
  FilterDimensions,
  RawDataset,
  useFilterDimensions,
} from "src/common/queries/wheresMyGene";
import { DispatchContext, State, StateContext } from "../../common/store";
import {
  selectFilters,
  selectPublicationFilter,
} from "../../common/store/actions";
import Organism from "./components/Organism";
import Compare from "./components/Compare";
import Sort from "./components/Sort";
import {
  StyledComplexFilter,
  StyledComplexFilterInputDropdown,
  ViewOptionsLabel,
  Wrapper,
} from "./style";
import ColorScale from "./components/ColorScale";
import { ViewOptionsWrapper } from "./components/Sort/style";
import { useRouter } from "next/router";
import { LoadStateFromURLPayload } from "../../common/store/reducer";

export type IFilters = Omit<State["selectedFilters"], "developmentStages">;

export const ANALYTICS_MAPPING: {
  [key in keyof IFilters]: {
    eventName: EVENTS;
    eventNameBefore: EVENTS;
    eventNameAfter: EVENTS;
    label: string;
  };
} = {
  datasets: {
    eventName: EVENTS.FILTER_SELECT_DATASET,
    eventNameBefore: EVENTS.FILTER_SELECT_DATASET_BEFORE_HEATMAP,
    eventNameAfter: EVENTS.FILTER_SELECT_DATASET_AFTER_HEATMAP,
    label: "dataset_name",
  },
  diseases: {
    eventName: EVENTS.FILTER_SELECT_DISEASE,
    eventNameBefore: EVENTS.FILTER_SELECT_DISEASE_BEFORE_HEATMAP,
    eventNameAfter: EVENTS.FILTER_SELECT_DISEASE_AFTER_HEATMAP,
    label: "disease",
  },
  ethnicities: {
    eventName: EVENTS.FILTER_SELECT_SELF_REPORTED_ETHNICITY,
    eventNameBefore: EVENTS.FILTER_SELECT_ETHNICITY_BEFORE_HEATMAP,
    eventNameAfter: EVENTS.FILTER_SELECT_ETHNICITY_AFTER_HEATMAP,
    label: "ethnicity",
  },
  publications: {
    eventName: EVENTS.FILTER_SELECT_PUBLICATION,
    eventNameBefore: EVENTS.FILTER_SELECT_PUBLICATION_BEFORE_HEATMAP,
    eventNameAfter: EVENTS.FILTER_SELECT_PUBLICATION_AFTER_HEATMAP,
    label: "publication",
  },
  sexes: {
    eventName: EVENTS.FILTER_SELECT_SEX,
    eventNameBefore: EVENTS.FILTER_SELECT_SEX_BEFORE_HEATMAP,
    eventNameAfter: EVENTS.FILTER_SELECT_SEX_AFTER_HEATMAP,
    label: "gender",
  },
};

const filterOptions = createFilterOptions({
  stringify: (option: RawDataset) =>
    `${option.label} ${option.collection_label}`,
});

const DropdownMenuProps = {
  filterOptions,
  getOptionSelected,
};

interface FilterOption {
  name: string;
  label: string;
  id: string;
}

const mapTermToFilterOption = (term: {
  id: string;
  name: string;
}): FilterOption => {
  return {
    name: term.name,
    label: `${term.name} (${term.id})`,
    id: term.id,
  };
};

// (cchoi): Created new type for the publication filter to avoid touching anything used in other files
type availableFilters = Partial<FilterDimensions> & {
  publicationFilter?: { id: string | string[]; name: string }[];
};

export interface Props {
  isLoading: boolean;
  availableFilters: availableFilters;
  setAvailableFilters: Dispatch<SetStateAction<availableFilters>>;
  setIsScaled: Dispatch<SetStateAction<boolean>>;
  loadedStateFromUrl: LoadStateFromURLPayload | null;
}

export default memo(function Filters({
  isLoading,
  availableFilters,
  setAvailableFilters,
  setIsScaled,
  loadedStateFromUrl,
}: Props): JSX.Element {
  const dispatch = useContext(DispatchContext);
  const state = useContext(StateContext);

  const {
    selectedFilters,
    selectedPublicationFilter,
    selectedTissues,
    selectedGenes,
  } = state;

  const {
    datasets: datasetIds,
    diseases,
    ethnicities,
    sexes,
  } = selectedFilters;
  const { pathname } = useRouter();
  const isVersion2 = pathname.includes("v2");

  const { publications } = selectedPublicationFilter;

  const {
    data: {
      datasets: rawDatasets,
      development_stage_terms: rawDevelopmentStages,
      disease_terms: rawDiseases,
      self_reported_ethnicity_terms: rawEthnicities,
      publicationFilter: rawPublications,
      sex_terms: rawSexes,
    },
    isLoading: rawIsLoading,
  } = useFilterDimensions(isVersion2 ? 2 : 1);

  const isHeatmapShown =
    (!selectedTissues || (selectedTissues && !!selectedTissues.length)) &&
    !!selectedGenes.length;

  const InputDropdownProps = {
    sdsStyle: "minimal",
  } as Partial<InputDropdownProps>;

  // (thuang): We only update available filters when API call is done,
  // otherwise when `useFilterDimensions()` is still loading, its filters
  // will temporarily be empty, and thus resetting the selected filter values
  useEffect(() => {
    if (rawIsLoading) return;
    const newDatasets = rawDatasets.map((dataset) => ({
      ...dataset,
      details: dataset.collection_label,
      name: dataset.label,
    }));
    newDatasets.sort((a, b) => a.name.localeCompare(b.name));

    const newSexes = rawSexes.map(mapTermToFilterOption);
    newSexes.sort((a, b) => a.name.localeCompare(b.name));

    const newDiseases = rawDiseases.map(mapTermToFilterOption);
    newDiseases.sort((a, b) =>
      a.name === "normal"
        ? -1
        : b.name === "normal"
        ? 1
        : a.name.localeCompare(b.name)
    );

    const newPublications = rawPublications.map(mapTermToFilterOption);
    newPublications.sort((a, b) => a.name.localeCompare(b.name));

    const newEthnicities = rawEthnicities.map(mapTermToFilterOption);
    newEthnicities.sort((a, b) => a.name.localeCompare(b.name));

    const newDevelopmentStages = rawDevelopmentStages.map(
      mapTermToFilterOption
    );
    newDevelopmentStages.sort((a, b) => a.name.localeCompare(b.name));

    const newAvailableFilters = {
      datasets: newDatasets,
      development_stage_terms: newDevelopmentStages,
      disease_terms: newDiseases,
      self_reported_ethnicity_terms: newEthnicities,
      publicationFilter: newPublications,
      sex_terms: newSexes,
    };

    if (isEqual(availableFilters, newAvailableFilters)) return;
    setAvailableFilters(newAvailableFilters);
  }, [
    rawDatasets,
    rawDevelopmentStages,
    rawDiseases,
    rawEthnicities,
    rawPublications,
    rawSexes,
    rawIsLoading,
    availableFilters,
    setAvailableFilters,
  ]);

  const {
    datasets = EMPTY_ARRAY,
    disease_terms = EMPTY_ARRAY,
    self_reported_ethnicity_terms = EMPTY_ARRAY,
    publicationFilter = EMPTY_ARRAY,
    sex_terms = EMPTY_ARRAY,
  } = availableFilters;

  const selectedDatasets = useMemo(() => {
    return datasets.filter((dataset) => datasetIds?.includes(dataset.id));
  }, [datasets, datasetIds]);

  const selectedDiseases = useMemo(() => {
    return disease_terms.filter((disease) => diseases?.includes(disease.id));
  }, [disease_terms, diseases]);

  const selectedEthnicities = useMemo(() => {
    return self_reported_ethnicity_terms.filter((ethnicity) =>
      ethnicities?.includes(ethnicity.id)
    );
  }, [self_reported_ethnicity_terms, ethnicities]);

  const selectedPublications = useMemo(() => {
    return publicationFilter.filter((publication) =>
      publications?.includes(publication.id)
    );
  }, [publicationFilter, publications]);

  const selectedSexes = useMemo(() => {
    return sex_terms.filter((sex) => sexes?.includes(sex.id));
  }, [sex_terms, sexes]);

  // Used to check if the filters were applied once from URL state
  const [filtersAppliedOnce, setFiltersAppliedOnce] = useState(false);

  const handleFilterChange = useCallback(
    function handleFilterChange_(
      key: keyof (IFilters & {
        publications?: DefaultMenuSelectOption[];
      })
    ): (options: DefaultMenuSelectOption[] | null) => void {
      let currentOptions: DefaultMenuSelectOption[] | null = null;

      return (options: DefaultMenuSelectOption[] | null): void => {
        if (
          !dispatch ||
          !options ||
          // If the options are the same
          JSON.stringify(options.sort(sortOptions)) ===
            JSON.stringify(currentOptions?.sort(sortOptions)) ||
          // If the options change from null to [], which is the default value
          (currentOptions === null && JSON.stringify(options) === "[]")
        ) {
          return;
        }

        const newlySelected = options.filter(
          (selected) => !currentOptions?.includes(selected)
        );

        // If there are newly selected filters, send an analytic event for each of them
        if (newlySelected.length) {
          newlySelected.forEach((selected) => {
            const { eventName, eventNameBefore, eventNameAfter, label } =
              ANALYTICS_MAPPING[key];

            if (!isHeatmapShown) {
              track(eventName, {
                [label]: selected.name,
              });
            } else if (loadedStateFromUrl && !filtersAppliedOnce) {
              // If there was a loaded state and filters have not been applied yet, then send 'before' event
              // Loading state from the URL will trigger this callback which changes state to apply filters
              track(eventNameBefore, {
                [label]: selected.name,
              });
            } else {
              // Filters were applied at least once
              track(eventNameAfter, {
                [label]: selected.name,
              });
            }
          });
        }

        currentOptions = options;

        if (key == "publications") {
          dispatch(
            selectPublicationFilter(
              key,
              options.map((option) => (option as unknown as { id: string }).id)
            )
          );
        } else {
          dispatch(
            selectFilters(
              key,
              options.map((option) => (option as unknown as { id: string }).id)
            )
          );
        }

        setFiltersAppliedOnce(true);
      };
    },
    [dispatch, filtersAppliedOnce, isHeatmapShown, loadedStateFromUrl]
  );

  const handleDatasetsChange = useMemo(
    () => handleFilterChange("datasets"),
    [handleFilterChange]
  );

  const handleDiseasesChange = useMemo(
    () => handleFilterChange("diseases"),
    [handleFilterChange]
  );

  const handleEthnicitiesChange = useMemo(
    () => handleFilterChange("ethnicities"),
    [handleFilterChange]
  );

  const handleSexesChange = useMemo(
    () => handleFilterChange("sexes"),
    [handleFilterChange]
  );

  const handlePublicationsChange = useMemo(
    () => handleFilterChange("publications"),
    [handleFilterChange]
  );

  return (
    <Wrapper>
      <div>
        <StyledComplexFilter
          multiple
          data-testid="dataset-filter"
          search
          label="Dataset"
          options={datasets as unknown as DefaultMenuSelectOption[]}
          onChange={handleDatasetsChange}
          value={selectedDatasets as unknown as DefaultMenuSelectOption[]}
          InputDropdownComponent={
            StyledComplexFilterInputDropdown as typeof ComplexFilterInputDropdown
          }
          DropdownMenuProps={DropdownMenuProps}
          InputDropdownProps={InputDropdownProps}
        />
        <StyledComplexFilter
          multiple
          data-testid="disease-filter"
          search
          label="Disease"
          options={disease_terms as unknown as DefaultMenuSelectOption[]}
          onChange={handleDiseasesChange}
          value={selectedDiseases as unknown as DefaultMenuSelectOption[]}
          InputDropdownComponent={
            StyledComplexFilterInputDropdown as typeof ComplexFilterInputDropdown
          }
          DropdownMenuProps={DropdownMenuProps}
          InputDropdownProps={InputDropdownProps}
        />
        <StyledComplexFilter
          multiple
          data-testid="self-reported-ethnicity-filter"
          search
          label="Self-Reported Ethnicity"
          options={
            self_reported_ethnicity_terms as unknown as DefaultMenuSelectOption[]
          }
          onChange={handleEthnicitiesChange}
          value={selectedEthnicities as unknown as DefaultMenuSelectOption[]}
          InputDropdownComponent={
            StyledComplexFilterInputDropdown as typeof ComplexFilterInputDropdown
          }
          DropdownMenuProps={DropdownMenuProps}
          InputDropdownProps={InputDropdownProps}
        />

        <StyledComplexFilter
          multiple
          data-testid="publication-filter"
          search
          label="Publication"
          options={publicationFilter as unknown as DefaultMenuSelectOption[]}
          onChange={handlePublicationsChange}
          value={selectedPublications as unknown as DefaultMenuSelectOption[]}
          InputDropdownComponent={
            StyledComplexFilterInputDropdown as typeof ComplexFilterInputDropdown
          }
          DropdownMenuProps={DropdownMenuProps}
          InputDropdownProps={InputDropdownProps}
        />

        <StyledComplexFilter
          multiple
          data-testid="sex-filter"
          search
          label="Sex"
          options={sex_terms as unknown as DefaultMenuSelectOption[]}
          onChange={handleSexesChange}
          value={selectedSexes as unknown as DefaultMenuSelectOption[]}
          InputDropdownComponent={
            StyledComplexFilterInputDropdown as typeof ComplexFilterInputDropdown
          }
          DropdownMenuProps={DropdownMenuProps}
          InputDropdownProps={InputDropdownProps}
        />
      </div>

      <Organism isLoading={isLoading} />

      <Compare areFiltersDisabled={!isHeatmapShown} />

      <div>
        <ViewOptionsLabel>View Options</ViewOptionsLabel>
        <ViewOptionsWrapper>
          <Sort areFiltersDisabled={!isHeatmapShown} />
          <ColorScale setIsScaled={setIsScaled} />
        </ViewOptionsWrapper>
      </div>
    </Wrapper>
  );
});

function getOptionSelected(
  option: { id: string },
  value: { id: string }
): boolean {
  return option.id === value.id;
}

function sortOptions(a: DefaultMenuSelectOption, b: DefaultMenuSelectOption) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}
