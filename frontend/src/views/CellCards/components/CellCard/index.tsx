import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Wrapper,
  CellCardName,
  CellCardHeader,
  StyledTag,
  CellCardsView,
  CellCardHeaderInnerWrapper,
  SearchBarWrapper,
  LEFT_RIGHT_PADDING_PX,
  SuggestChangeButton,
  SearchBarPositioner,
} from "./style";
import { useCellTypesById } from "src/common/queries/cellCards";
import Description from "./components/Description";
import CellCardSearchBar from "../CellCardSearchBar";
import MarkerGeneTables from "./components/MarkerGeneTables";
import OntologyDagView from "../common/OntologyDagView";
import FullScreenProvider from "../common/FullScreenProvider";
import SourceDataTable from "./components/SourceDataTable";
import CellCardSidebar from "./components/CellCardSidebar";

export const CELL_CARD_HEADER_NAME = "cell-card-header-name";
export const CELL_CARD_HEADER_TAG = "cell-card-header-tag";

// This is the desired width of the CellCard components right after the sidebar is hidden.
const BREAKPOINT_WIDTH = 960;

export default function CellCard(): JSX.Element {
  const router = useRouter();

  // Navigation
  const sectionRef0 = React.useRef(null);
  const sectionRef1 = React.useRef(null);
  const sectionRef2 = React.useRef(null);
  const sectionRef3 = React.useRef(null);

  const [skinnyMode, setSkinnyMode] = useState<boolean>(true);
  // cell type id
  const { cellTypeId: cellTypeIdRaw } = router.query;
  const cellTypeId = (cellTypeIdRaw as string)?.replace("_", ":") ?? "";
  const cellTypesById = useCellTypesById() ?? {};
  const cellTypeName = cellTypesById[cellTypeId] ?? "";

  useEffect(() => {
    const handleResize = () =>
      setSkinnyMode(
        window.innerWidth < BREAKPOINT_WIDTH + 2 * LEFT_RIGHT_PADDING_PX
      );
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <CellCardsView skinnyMode={skinnyMode}>
      {/* Flex item left */}
      <Wrapper>
        {/* (thuang): Somehow we need a parent to prevent error:
          NotFoundError: Failed to execute 'insertBefore' on 'Node'
         */}
        <div>
          {skinnyMode && (
            <SearchBarPositioner>
              <SearchBarWrapper>
                <CellCardSearchBar />
              </SearchBarWrapper>
            </SearchBarPositioner>
          )}
        </div>
        {/* Intro section */}
        <div ref={sectionRef0} id="section-0" data-testid="section-0" />
        <CellCardHeader>
          <CellCardHeaderInnerWrapper>
            <CellCardName data-testid={CELL_CARD_HEADER_NAME}>
              {cellTypeName.charAt(0).toUpperCase() + cellTypeName.slice(1)}
            </CellCardName>
            <a
              href={`https://www.ebi.ac.uk/ols4/ontologies/cl/classes/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252F${cellTypeIdRaw}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <StyledTag
                data-testid={CELL_CARD_HEADER_TAG}
                label={cellTypeId}
                sdsType="secondary"
                sdsStyle="square"
                color="gray"
                hover
              />
            </a>
          </CellCardHeaderInnerWrapper>
          <a
            href="https://airtable.com/shrEReYLtRTAAsNiE"
            target="_blank"
            rel="noreferrer noopener"
          >
            <SuggestChangeButton sdsType="primary" sdsStyle="minimal">
              Suggest Change
            </SuggestChangeButton>
          </a>
        </CellCardHeader>
        <Description cellTypeId={cellTypeId} cellTypeName={cellTypeName} />

        {/* Cell Ontology section */}
        <div ref={sectionRef1} id="section-1" data-testid="section-1" />
        <FullScreenProvider>
          <OntologyDagView cellTypeId={cellTypeId} skinnyMode={skinnyMode} />
        </FullScreenProvider>

        {/* Marker Genes section */}
        <div ref={sectionRef2} id="section-2" data-testid="section-2" />
        <MarkerGeneTables cellTypeId={cellTypeId} />

        {/* Source Data section */}
        <div ref={sectionRef3} id="section-3" data-testid="section-3" />
        <SourceDataTable cellTypeId={cellTypeId} />
      </Wrapper>

      {/* Flex item right */}
      {!skinnyMode && (
        <CellCardSidebar
          items={[
            { elementRef: sectionRef0, title: "Intro" },
            { elementRef: sectionRef1, title: "Cell Ontology" },
            { elementRef: sectionRef2, title: "Marker Genes" },
            { elementRef: sectionRef3, title: "Source Data" },
          ]}
        />
      )}
    </CellCardsView>
  );
}
