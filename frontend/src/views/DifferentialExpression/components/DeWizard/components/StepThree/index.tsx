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
  ButtonsWrapper,
  BackButton,
  RestartButton,
} from "./style";
import { QueryGroupWithNames } from "src/views/DifferentialExpression/common/store/reducer";
interface Props {
  setStep: (step: number) => void;
}
interface DifferentialExpressionRow {
  name: string;
  pValue: number;
  effectSize: number;
}

export default function StepThree({ setStep }: Props): JSX.Element {
  const { data: rawDifferentialExpressionResults, isLoading } =
    useDifferentialExpression();
  const [differentialExpressionResults, setDifferentialExpressionResults] =
    useState<DifferentialExpressionRow[][]>([]);
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
        return diffExpResult.map((result) => {
          return {
            name: genesById.get(result.gene_ontology_term_id)?.name ?? "", // nullish coalescing operator for type safety
            pValue: result.p_value,
            effectSize: result.effect_size,
          };
        });
      }
    );
    setDifferentialExpressionResults(formattedResults);
  }, [
    rawDifferentialExpressionResults,
    isLoading,
    isLoadingPrimaryFilters,
    rawGenes,
  ]);

  const handleCopyGenes = useCallback(
    function handleCopyGenes_(index: number): () => void {
      return () => {
        const results = differentialExpressionResults[index];
        const genes = results.map((result) => result.name);
        console.log(genes);
        console.log(results);
        navigator.clipboard.writeText(genes.join(", "));
      };
    },
    [differentialExpressionResults]
  );

  const handleGoBack = () => {
    setStep(2);
  };
  const handleStartOver = () => {
    setStep(1);
  };

  const namesToShow: string[][] = [];
  for (const [index, queryGroupWithNames] of (
    queryGroupsWithNames ?? []
  ).entries()) {
    namesToShow.push([]);
    for (const key in queryGroupWithNames) {
      for (const value of queryGroupWithNames[
        key as keyof QueryGroupWithNames
      ]) {
        namesToShow[index].push(value);
      }
    }
  }

  return (
    <div>
      <ButtonsWrapper>
        <BackButton
          color="primary"
          size="large"
          variant="contained"
          onClick={handleGoBack}
        >
          Back
        </BackButton>
        <RestartButton
          color="primary"
          size="large"
          variant="contained"
          onClick={handleStartOver}
        >
          Start over
        </RestartButton>
      </ButtonsWrapper>
      {isLoading && <div>Loading...</div>}
      {differentialExpressionResults.map((results, index) => {
        return (
          <div>
            <QueryGroupTitle>Query Group {index + 1}</QueryGroupTitle>
            <QueryGroupSubTitle>
              {namesToShow[index].join(", ")}
            </QueryGroupSubTitle>
            <TableWrapper>
              <StyledHTMLTable condensed bordered={false}>
                <thead>
                  <tr>
                    <td>
                      <CopyGenesButton
                        onClick={handleCopyGenes(index)}
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
            </TableWrapper>
          </div>
        );
      })}
    </div>
  );
}
