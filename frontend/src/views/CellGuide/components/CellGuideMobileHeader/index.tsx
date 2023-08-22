import { useContext, useState } from "react";
import CellGuideCardSearchBar from "../CellGuideCardSearchBar";
import { ButtonIcon } from "@czi-sds/components";
import { MobileHeaderWrapper, StyledTitle } from "./style";
import { StateContext } from "../../common/store";
import { HEADER_HEIGHT_PX } from "src/components/Header/style";

const CellGuideMobileHeader = () => {
  const { cellGuideTitle, cellGuideNav } = useContext(StateContext);

  const [searchIsOpen, setSearchIsOpen] = useState(false);
  const [pageNavIsOpen, setPageNavIsOpen] = useState(false);

  return (
    <>
      <MobileHeaderWrapper>
        {/* CellGuide Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            height: HEADER_HEIGHT_PX,
            alignItems: "center",
            backgroundColor: "white",
            padding: "0 8px",
            gap: 16,
          }}
        >
          {searchIsOpen ? (
            <div
              style={{ width: "100%", padding: "0px 16px" }}
              onBlur={() => {
                // Hide the input box
                setSearchIsOpen(false);
              }}
            >
              <CellGuideCardSearchBar autoFocus />
            </div>
          ) : (
            <>
              {/* Flex Item Left */}
              <div id="cellguide-search-icon">
                <ButtonIcon
                  sdsIcon="search"
                  id="cellguide-search-icon"
                  onClick={() => {
                    setSearchIsOpen(true);
                  }}
                />
              </div>

              {/* Flex Item Middle */}
              <StyledTitle id="cellguide-topic">{cellGuideTitle}</StyledTitle>

              {/* Flex Item Right */}
              <div id="cellguide-nav-dropdown">
                <ButtonIcon
                  sdsIcon="chevronDown"
                  onClick={() => {
                    console.log("Setting page nav is open");
                    setPageNavIsOpen(!pageNavIsOpen);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* CellGuide Page Nav */}
        <div
          onClick={() => {
            setPageNavIsOpen(false);
          }}
          style={{
            width: "100%",
            position: "relative",
            top: 0,
            backgroundColor: "white",
            borderBottom: "1px solid lightgrey",
            padding: "0px 16px",
          }}
        >
          {pageNavIsOpen && cellGuideNav}
        </div>
      </MobileHeaderWrapper>
    </>
  );
};

export default CellGuideMobileHeader;
