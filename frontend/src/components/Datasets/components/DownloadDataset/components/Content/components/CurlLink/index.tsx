import copy from "clipboard-copy";
import { FC, ReactNode } from "react";
import { Caption, CodeBlock, CopyButton as Button } from "./style";

interface Props {
  fileName: string;
  handleAnalytics: () => void;
  link: string;
}

const CurlLink: FC<Props> = ({ fileName, handleAnalytics, link }) => {
  const curl = `curl -o ${fileName} "${link}"`;

  const handleCopyClick = () => {
    copy(curl);
    handleAnalytics();
  };

  return (
    <>
      <CodeBlock>
        <code>{renderCURLPreview(fileName, link)}</code>
        <Button
          isAllCaps={false}
          onClick={handleCopyClick}
          sdsStyle="minimal"
          sdsType="primary"
        >
          Copy
        </Button>
      </CodeBlock>
      <Caption>
        If you prefer not to download this dataset directly in your browser, you
        can optionally use the provided cURL link to download via the terminal.
        The above link will be valid for 1 week.
      </Caption>
    </>
  );
};

export default CurlLink;

/**
 * Renders a preview of the cURL command.
 * @param fileName - File name.
 * @param link - Download link.
 * @returns react node with the cURL command.
 */
function renderCURLPreview(fileName: string, link: string): ReactNode {
  const { origin, pathname } = new URL(link);
  return (
    <>
      curl -o ${fileName} &quot;{origin}/<br />
      {pathname.slice(1)}&quot;
    </>
  );
}
