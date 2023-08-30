import React, { ElementType, useState } from "react";
import { useDatasetAssets } from "src/components/Collection/components/CollectionDatasetsGrid/components/Row/DownloadDataset/util";
import Content from "src/components/Datasets/components/DownloadDataset/components/Content";
import { Dialog } from "src/components/Datasets/components/DownloadDataset/style";

interface Props {
  Button: ElementType;
  datasetId: string;
  isDisabled?: boolean;
  name: string;
}

/**
 * Fetch dataset assets on click of download button. Based on Dataset/components/DownloadDataset/components/index but
 * fetches dataset assets rather than accepts dataset assets as props. Required for core datasets table as dataset
 * assets are not included in the "light" datasets/index endpoint that backs the table and are therefore fetched on
 * demand.
 */
export default function DownloadDataset({
  Button,
  datasetId,
  isDisabled = false,
  name,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Close modal.
  const closeModal = () => {
    setIsOpen(false);
  };

  // Fetch the dataset assets on open of download modal.
  const { datasetAssets, isError, isLoading } = useDatasetAssets(
    datasetId,
    isOpen
  );

  return (
    <>
      <Button
        datasetName={name}
        data-testid="dataset-download-button"
        disabled={isDisabled}
        onClick={() => setIsOpen(true)}
      />
      <Dialog onClose={closeModal} open={isOpen}>
        <Content
          isError={isError}
          isLoading={isLoading}
          name={name}
          dataAssets={datasetAssets}
          onClose={closeModal}
        />
      </Dialog>
    </>
  );
}
