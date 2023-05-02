import { Icon } from "czifui";
import { useState, useEffect, useContext, useCallback } from "react";
import {
  OntologyTerm,
  useDifferentialExpression,
  usePrimaryFilterDimensions,
} from "src/common/queries/differentialExpression";
import { StateContext } from "src/views/DifferentialExpression/common/store";
import {
  CopyGenesButton,
  QueryGroupSubTitle,
  QueryGroupTitle,
  StyledHTMLTable,
  TableWrapper,
  NoDeGenesContainer,
  NoDeGenesDescription,
  NoDeGenesHeader,
} from "./style";
import { QueryGroup } from "src/views/DifferentialExpression/common/store/reducer";

interface DifferentialExpressionRow {
  name: string;
  pValue: number;
  effectSize: number;
}

export default function DeResults(): JSX.Element {
  const { data: rawDifferentialExpressionResults, isLoading } =
    useDifferentialExpression();
  const [differentialExpressionResults, setDifferentialExpressionResults] =
    useState<DifferentialExpressionRow[]>([]);
  const { data, isLoading: isLoadingPrimaryFilters } =
    usePrimaryFilterDimensions();
  const { genes: rawGenes } = data || {};
  const { organismId, queryGroupsWithNames } = useContext(StateContext);

  useEffect(() => {
    if (
      !rawGenes ||
      isLoadingPrimaryFilters ||
      isLoading ||
      !rawDifferentialExpressionResults.length
    )
      return;
    const genes = rawGenes[organismId || ""];
    const genesById = genes.reduce((acc, gene) => {
      return acc.set(gene.id, gene);
    }, new Map<OntologyTerm["id"], OntologyTerm>());

    // map ids to name
    const formattedResults = rawDifferentialExpressionResults.map(
      (diffExpResult) => {
        return {
          name: genesById.get(diffExpResult.gene_ontology_term_id)?.name ?? "", // nullish coalescing operator for type safety
          pValue: diffExpResult.p_value,
          effectSize: diffExpResult.effect_size,
        };
      }
    );
    setDifferentialExpressionResults(formattedResults);
  }, [
    rawDifferentialExpressionResults,
    isLoading,
    isLoadingPrimaryFilters,
    rawGenes,
  ]);

  const handleCopyGenes = () => {
    const genes = differentialExpressionResults.map((result) => result.name);
    navigator.clipboard.writeText(genes.join(", "));
  };

  const namesToShow: string[][] = [];
  const { queryGroup1, queryGroup2 } = queryGroupsWithNames;
  for (const [index, queryGroupWithNames] of [
    queryGroup1,
    queryGroup2,
  ].entries()) {
    namesToShow.push([]);
    for (const key in queryGroupWithNames) {
      for (const value of queryGroupWithNames[key as keyof QueryGroup]) {
        namesToShow[index].push(value);
      }
    }
  }
  console.log(differentialExpressionResults);
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {[differentialExpressionResults].map((results, index) => {
        return (
          <div>
            <QueryGroupTitle>Query Group {index + 1}</QueryGroupTitle>
            <QueryGroupSubTitle>
              {namesToShow[index].join(", ")}
            </QueryGroupSubTitle>
            <TableWrapper>
              {results.length > 0 ? (
                <StyledHTMLTable condensed bordered={false}>
                  <thead>
                    <tr>
                      <td>
                        <CopyGenesButton
                          onClick={handleCopyGenes}
                          sdsType="primary"
                          sdsStyle="minimal"
                          isAllCaps={false}
                          startIcon={
                            <Icon sdsIcon="copy" sdsSize="s" sdsType="button" />
                          }
                        >
                          Copy Genes
                        </CopyGenesButton>
                      </td>
                    </tr>
                    <tr>
                      <td>Gene </td>
                      <td>P-value</td>
                      <td>Effect size</td>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => {
                      const { name: symbol, pValue, effectSize } = result;
                      return (
                        <tr key={symbol}>
                          <td>{symbol}</td>
                          <td>{pValue.toPrecision(4)}</td>
                          <td>{effectSize.toPrecision(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </StyledHTMLTable>
              ) : (
                <NoDeGenesContainer>
                  <NoDeGenesHeader>
                    No Differentially Expressed Genes
                  </NoDeGenesHeader>
                  <NoDeGenesDescription>
                    No differentially expressed genes for this query group.
                  </NoDeGenesDescription>
                </NoDeGenesContainer>
              )}
            </TableWrapper>
          </div>
        );
      })}
    </div>
  );
}
