import { useMemo } from "react";
import { ComputationalMarkersQueryResponse } from "src/common/queries/cellGuide";
import { FMG_GENE_STRENGTH_THRESHOLD } from "src/views/WheresMyGene/common/constants";
import { HOMO_SAPIENS, ALL_TISSUES } from "../constants";

interface ComputationalMarkerGeneTableData {
  symbol: string;
  name: string;
  marker_score: string;
  me: string;
  pc: string;
}

function _getSortedOrganisms(
  genes: ComputationalMarkersQueryResponse
): string[] {
  const organisms = new Set<string>();
  for (const markerGene of genes) {
    if (markerGene.marker_score < FMG_GENE_STRENGTH_THRESHOLD) continue;
    organisms.add(markerGene.groupby_dims.organism_ontology_term_label);
  }
  return Array.from(organisms).sort((a, b) => {
    if (a === HOMO_SAPIENS) return -1;
    if (b === HOMO_SAPIENS) return 1;
    return a.localeCompare(b);
  });
}

function _getSortedOrgans(
  genes: ComputationalMarkersQueryResponse,
  selectedOrganismFilter: string
): string[] {
  const organs = new Set<string>();
  for (const markerGene of genes) {
    if (
      markerGene.groupby_dims.organism_ontology_term_label !==
      selectedOrganismFilter
    )
      continue;
    if (markerGene.marker_score < FMG_GENE_STRENGTH_THRESHOLD) continue;
    organs.add(
      markerGene.groupby_dims.tissue_ontology_term_label ?? "All Tissues"
    );
  }

  return Array.from(organs).sort((a, b) => {
    if (a === ALL_TISSUES) return -1;
    if (b === ALL_TISSUES) return 1;
    return a.localeCompare(b);
  });
}

export function useComputationalMarkerGenesTableRowsAndFilters({
  genes,
  selectedOrganism,
  selectedOrgan,
}: {
  genes: ComputationalMarkersQueryResponse;
  selectedOrganism: string;
  selectedOrgan: string;
}): {
  selectedOrganismFilter: string;
  selectedOrganFilter: string;
  computationalMarkerGeneTableData: ComputationalMarkerGeneTableData[];
  uniqueOrganisms: string[];
  uniqueOrgans: string[];
} {
  return useMemo(() => {
    if (!genes)
      return {
        selectedOrganismFilter: selectedOrganism,
        selectedOrganFilter: selectedOrgan,
        computationalMarkerGeneTableData: [],
        uniqueOrganisms: [],
        uniqueOrgans: [],
      };

    // get sorted organisms
    const sortedOrganisms = _getSortedOrganisms(genes);
    const selectedOrganismFilter =
      selectedOrganism === "" || !sortedOrganisms.includes(selectedOrganism)
        ? sortedOrganisms.at(0) ?? ""
        : selectedOrganism;

    // get sorted organs
    const sortedOrgans = _getSortedOrgans(genes, selectedOrganismFilter);
    const selectedOrganFilter =
      selectedOrgan === "" || !sortedOrgans.includes(selectedOrgan)
        ? sortedOrgans.at(0) ?? ""
        : selectedOrgan;

    const rows: ComputationalMarkerGeneTableData[] = [];
    for (const markerGene of genes) {
      const { pc, me, name, symbol, groupby_dims, marker_score } = markerGene;
      const {
        organism_ontology_term_label,
        tissue_ontology_term_label = "All Tissues",
      } = groupby_dims;

      if (organism_ontology_term_label !== selectedOrganismFilter) continue;
      if (tissue_ontology_term_label !== selectedOrganFilter) continue;
      if (marker_score < FMG_GENE_STRENGTH_THRESHOLD) continue;
      rows.push({
        symbol,
        name,
        marker_score: marker_score.toFixed(2),
        me: me.toFixed(2),
        pc: (pc * 100).toFixed(1),
      });
    }

    return {
      selectedOrganismFilter,
      selectedOrganFilter,
      computationalMarkerGeneTableData: rows,
      uniqueOrganisms: sortedOrganisms,
      uniqueOrgans: sortedOrgans,
    };
  }, [genes, selectedOrganism, selectedOrgan]);
}
