import * as React from "react";
import { ElementType, FC } from "react";
import { EMPTY_ARRAY } from "src/common/constants/utils";
import { Dataset } from "src/common/entities";
import Content from "src/components/Datasets/components/DownloadDataset/components/Content";
import { Dialog } from "src/components/Datasets/components/DownloadDataset/style";

interface Props {
  Button: ElementType;
  dataAssets: Dataset["dataset_assets"];
  isDisabled?: boolean;
  name: string;
}

const DownloadDataset: FC<Props> = ({
  Button,
  dataAssets = EMPTY_ARRAY,
  isDisabled = false,
  name,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close modal.
  const closeModal = () => {
    setIsOpen(false);
  };

  if (!dataAssets.length) {
    return null; // TODO(cc) why return null when the button is disabled?
  }

  return (
    <>
      <Button
        datasetName={name}
        data-testid="dataset-download-button"
        disabled={isDisabled || !dataAssets.length}
        onClick={() => setIsOpen(true)}
      />
      <Dialog onClose={closeModal} open={isOpen}>
        <Content name={name} dataAssets={dataAssets} onClose={closeModal} />
      </Dialog>
    </>
  );
};

export default DownloadDataset;
