import styled from "@emotion/styled";
import {
  CommonThemeProps,
  fontHeaderXl,
  fontHeaderXxl,
  Tag,
} from "@czi-sds/components";

import RightSideBar from "src/components/common/RightSideBar";
import { HEADER_HEIGHT_PX } from "src/components/Header/style";
import Synonyms from "src/components/Synonyms";
import {
  fontWeightSemibold,
  spacesL,
  spacesM,
  spacesXxl,
  spacesXxs,
} from "src/common/theme";
import { StyledDiv } from "src/views/WheresMyGene/components/ScreenTint/style";
import OntologyId from "src/views/CellGuide/components/OntologyId";
import { keyframes } from "@emotion/react";
import { DEFAULT_ONTOLOGY_WIDTH } from "../common/OntologyDagView/common/constants";
import { SKINNY_MODE_BREAKPOINT_WIDTH } from "./constants";

export const TOP_PADDING_PX = 32;
export const SIDEBAR_COLUMN_GAP_PX = 120;
export const CELLGUIDE_CARD_MAX_WIDTH = 1440;
// spacing.xxl and spacing.xl
export const LEFT_RIGHT_PADDING_PX_XXL = 40;

interface CellGuideViewProps extends CommonThemeProps {
  skinnyMode: boolean;
}

export const CellGuideView = styled.div<CellGuideViewProps>`
  display: flex;
  flex-direction: row;
  column-gap: ${SIDEBAR_COLUMN_GAP_PX}px;
  max-width: 100vw;

  ${(props) => {
    const { skinnyMode } = props;
    const space = skinnyMode ? spacesL(props) : spacesXxl(props);
    return `
    padding: ${TOP_PADDING_PX}px ${space}px 0px
      ${space}px;
    `;
  }}
`;

export const CellGuideWrapper = styled.div<CellGuideViewProps>`
  margin: 0 auto 80px;
  width: ${(props) =>
    props.skinnyMode
      ? `${DEFAULT_ONTOLOGY_WIDTH}px`
      : `${CELLGUIDE_CARD_MAX_WIDTH}px`};
`;

export const Wrapper = styled.div<CellGuideViewProps>`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow-x: hidden;
  ${(props) => {
    const { skinnyMode } = props;
    const maxWidth = skinnyMode
      ? `${DEFAULT_ONTOLOGY_WIDTH}px`
      : `${SKINNY_MODE_BREAKPOINT_WIDTH + SIDEBAR_COLUMN_GAP_PX}px`;
    return `
    max-width: ${maxWidth};
    `;
  }}
`;

export const NavBarDropdownWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: ${spacesM}px;
`;

export const CellGuideCardHeaderInnerWrapper = styled.div`
  display: flex;
  column-gap: 8px;
  align-items: center;
`;

export const CellGuideCardHeader = styled.div`
  display: flex;
  column-gap: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const CellGuideCardName = styled.h1`
  ${fontHeaderXxl}
  font-weight: 700;
  margin-bottom: 0;
`;

export const StyledTag = styled(Tag)`
  height: 24px;
  margin: 0;
`;

export const SearchBarPositioner = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const SearchBarWrapper = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const slideIn = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

interface StyledRightSideBarProps extends CommonThemeProps {
  skinnyMode: boolean;
}

export const StyledRightSideBar = styled(RightSideBar)<StyledRightSideBarProps>`
  position: fixed;
  right: 0;
  height: 100vh;
  background-color: white;
  z-index: 10;
  top: ${HEADER_HEIGHT_PX}px;
  animation: ${slideIn} 0.2s ease-in-out forwards;

  ${(props) => {
    if (props.skinnyMode) {
      return `
        width: 100vw;
        height: calc(100vh - ${HEADER_HEIGHT_PX}px);
      `;
    }
  }}
`;

export const StyledSynonyms = styled(Synonyms)`
  margin-top: ${spacesXxs}px;
  margin-left: ${spacesL}px;
`;

export const StyledOntologyId = styled(OntologyId)`
  margin-top: ${spacesXxs}px;
  margin-left: ${spacesL}px;
`;

export const MobileSearchTint = styled(StyledDiv)`
  z-index: 1;
  background: rgba(0, 0, 0, 0.3);
  position: fixed;
`;

export const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const MobileTooltipTitle = styled.div`
  ${fontHeaderXl}
  font-weight: ${fontWeightSemibold};
`;

export const MobileTooltipWrapper = styled.div`
  top: ${HEADER_HEIGHT_PX}px;
  position: fixed;
  z-index: 99;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${HEADER_HEIGHT_PX}px);
  width: 100vw;
  padding: ${spacesL}px;
  gap: ${spacesL}px;
  overflow: auto;
`;

export const MobileTooltipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
