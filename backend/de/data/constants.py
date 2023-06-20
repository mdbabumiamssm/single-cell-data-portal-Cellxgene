# Minimum number of expressed genes for a cell to be included in the corpus.
# See the following document for further details:
# https://github.com/chanzuckerberg/cellxgene-documentation/blob/main/scExpression/scExpression-documentation.md#removal-of-low-coverage-cells
GENE_EXPRESSION_COUNT_MIN_THRESHOLD = 500

# wmg only includes data generated by assays that normalize for gene length
INCLUDED_ASSAYS = {
    "EFO:0010550": "sci-RNA-seq",
    "EFO:0009901": "10x 3' v1",
    "EFO:0011025": "10x 5' v1",
    "EFO:0009899": "10x 3' v2",
    "EFO:0009900": "10x 5' v2",
    "EFO:0009922": "10x 3' v3",
    "EFO:0030003": "10x 3' transcription profiling",
    "EFO:0030004": "10x 5' transcription profiling",
    "EFO:0008919": "Seq-Well",
    "EFO:0008995": "10x technology",
    "EFO:0008722": "Drop-seq",
    "EFO:0010010": "CEL-seq2",
}
