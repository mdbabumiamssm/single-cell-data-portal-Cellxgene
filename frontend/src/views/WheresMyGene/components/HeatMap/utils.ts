import { interpolateYlOrRd } from "d3-scale-chromatic";
import {
  DatasetComponentOption,
  DefaultLabelFormatterCallbackParams,
  EChartsOption,
  ScatterSeriesOption,
} from "echarts";
import { State } from "../../common/store";
import {
  CellTypeSummary,
  GeneExpressionSummary,
  Tissue,
} from "../../common/types";

export const MAX_FIRST_PART_LENGTH_PX = 16;
export const X_AXIS_CHART_HEIGHT_PX = 80;
export const Y_AXIS_CHART_WIDTH_PX = 300;

const Y_AXIS_BOTTOM_PADDING = "10px";

const COMMON_OPTIONS = {
  animation: false,
  hoverLayerThreshold: 10,
  progressive: 1e6,
};

const COMMON_SERIES: ScatterSeriesOption = {
  emphasis: { itemStyle: { color: "inherit" }, scale: false },
  encode: {
    x: "geneIndex",
    y: "cellTypeIndex",
  },
  legendHoverLink: false,
  name: "wmg",
  type: "scatter",
};

const COMMON_AXIS_POINTER: EChartsOption["axisPointer"] = {
  link: [
    {
      xAxisIndex: "all",
    },
  ],
  show: true,
  triggerOn: "click",
  triggerTooltip: false,
};

interface CreateChartOptionsProps {
  cellTypeMetadata: string[];
  chartData: ChartFormat[];
  geneNames: string[];
}

export function createChartOptions({
  cellTypeMetadata,
  chartData,
  geneNames,
}: CreateChartOptionsProps): EChartsOption {
  return {
    ...COMMON_OPTIONS,
    axisPointer: { ...COMMON_AXIS_POINTER, label: { show: false } },
    dataset: {
      source: chartData as DatasetComponentOption["source"],
    },
    grid: {
      bottom: Y_AXIS_BOTTOM_PADDING,
      left: Y_AXIS_CHART_WIDTH_PX + "px",
      top: X_AXIS_CHART_HEIGHT_PX + "px",
    },
    series: [
      {
        ...COMMON_SERIES,
        itemStyle: {
          color(props: DefaultLabelFormatterCallbackParams) {
            const { scaledMeanExpression } = props.data as {
              scaledMeanExpression: number;
            };

            return interpolateYlOrRd(scaledMeanExpression);
          },
        },
        symbolSize: function (props: { percentage: number }) {
          const { percentage } = props;

          return Math.round(MAX_FIRST_PART_LENGTH_PX * percentage);
        },
      },
    ],
    tooltip: {
      formatter(props) {
        const { name: cellTypeMetadata, data } = props as unknown as {
          name: string;
          data: ChartFormat;
        };

        if (!data) return "";

        const { geneIndex, percentage, meanExpression, scaledMeanExpression } =
          data;

        const { name } = deserializeCellTypeMetadata(
          cellTypeMetadata as CellTypeMetadata
        );

        return `
          cell type: ${name}
          <br />
          gene: ${geneNames[geneIndex]}
          <br />
          percentage: ${percentage}
          <br />
          mean expression: ${meanExpression}
          <br />
          scaledMeanExpression: ${scaledMeanExpression}
        `;
      },
      position: "top",
    },
    xAxis: [
      {
        axisLabel: { fontSize: 0, rotate: 90 },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        boundaryGap: true,
        data: geneNames,
        splitLine: {
          show: false,
        },
        type: "category",
      },
    ],
    yAxis: [
      {
        axisLabel: { fontSize: 0 },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        boundaryGap: true,
        data: cellTypeMetadata,
        splitLine: {
          show: false,
        },
      },
    ],
  };
}

interface CreateXAxisOptionsProps {
  geneNames: string[];
  genesToDelete: string[];
}

export function createXAxisOptions({
  geneNames,
  genesToDelete,
}: CreateXAxisOptionsProps): EChartsOption {
  return {
    ...COMMON_OPTIONS,
    axisPointer: { ...COMMON_AXIS_POINTER },
    grid: {
      bottom: "0",
      left: "300px",
      top: "300px",
    },
    series: [
      {
        ...COMMON_SERIES,
        symbolSize: 0,
      },
    ],
    xAxis: [
      {
        axisLabel: {
          formatter(value) {
            return genesToDelete.includes(value)
              ? `{selected|${value}}`
              : value;
          },
          rich: {
            selected: {
              color: "red",
              fontWeight: "bold",
            },
          },
          rotate: 270,
          verticalAlign: "middle",
          width: 200,
        },
        axisTick: {
          show: false,
        },
        boundaryGap: true,
        data: geneNames,
        position: "top",
        triggerEvent: true,
        type: "category",
      },
    ],
    yAxis: [
      {
        axisLabel: { fontSize: 0 },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
    ],
  };
}

interface CreateYAxisOptionsProps {
  cellTypeMetadata: CellTypeMetadata[];
  cellTypeIdsToDelete: string[];
}

export function createYAxisOptions({
  cellTypeMetadata,
  cellTypeIdsToDelete,
}: CreateYAxisOptionsProps): EChartsOption {
  return {
    ...COMMON_OPTIONS,
    axisPointer: { ...COMMON_AXIS_POINTER },
    grid: {
      bottom: Y_AXIS_BOTTOM_PADDING,
      left: "300px",
      right: 0,
      top: 0,
    },
    series: [
      {
        ...COMMON_SERIES,
        symbolSize: 0,
      },
    ],
    xAxis: [
      {
        axisLabel: { fontSize: 0, rotate: 90 },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        type: "category",
      },
    ],
    yAxis: [
      {
        axisLabel: {
          formatter(value) {
            const { name } = deserializeCellTypeMetadata(
              value as CellTypeMetadata
            );

            return cellTypeIdsToDelete.includes(value)
              ? `{selected|${name}}`
              : name;
          },
          rich: {
            selected: {
              color: "red",
              fontWeight: "bold",
            },
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        boundaryGap: true,
        data: cellTypeMetadata,
        splitLine: {
          show: false,
        },
        triggerEvent: true,
      },
    ],
  };
}

export interface ChartFormat {
  cellTypeIndex: number;
  geneIndex: number;
  percentage: number;
  meanExpression: number;
  scaledMeanExpression: number;
}

export function dataToChartFormat(
  cellTypeSummaries: CellTypeSummary[],
  genes: GeneExpressionSummary[]
): ChartFormat[] {
  let min = Infinity;
  let max = -Infinity;

  for (const cellTypeSummary of cellTypeSummaries) {
    const { geneExpressions } = cellTypeSummary;

    if (!geneExpressions) continue;

    for (const geneExpression of Object.values(geneExpressions)) {
      const { meanExpression } = geneExpression;

      min = Math.min(min, meanExpression);
      max = Math.max(max, meanExpression);
    }
  }

  const oldRange = max - min;

  const result = cellTypeSummaries.flatMap((dataPoint) => {
    return toChartFormat(dataPoint);
  });

  return result;

  function toChartFormat(dataPoint: CellTypeSummary): ChartFormat[] {
    const { geneExpressions } = dataPoint;

    if (!geneExpressions) return [];

    return Object.entries(geneExpressions).map(([geneName, geneExpression]) => {
      const { percentage, meanExpression } = geneExpression;

      const scaledMeanExpression = (meanExpression - min) / oldRange;

      const geneIndex = genes.findIndex((gene) => gene.name === geneName);

      const cellTypeIndex = cellTypeSummaries.findIndex(
        (cellTypeSummary) => cellTypeSummary.id === dataPoint.id
      );

      const id = `${dataPoint.id}-${geneName}`;

      return {
        cellTypeIndex,
        geneIndex,
        id,
        meanExpression,
        percentage,
        scaledMeanExpression,
      } as ChartFormat;
    });
  }
}

const HEAT_MAP_BASE_WIDTH_PX = 500;
const HEAT_MAP_BASE_HEIGHT_PX = 300;
const HEAT_MAP_BASE_CELL_PX = 20;

/**
 * Approximating the heatmap width by the number of genes.
 * This is used to make sure the table cell size stays the same regardless
 * of the number of genes selected.
 */
export function getHeatmapWidth(
  genes: GeneExpressionSummary[] | State["selectedGenes"]
): number {
  return HEAT_MAP_BASE_WIDTH_PX + HEAT_MAP_BASE_CELL_PX * genes.length;
}

/**
 * Approximating the heatmap height by the number of cells.
 */
export function getHeatmapHeight(cellTypes: CellTypeSummary[] = []): number {
  return HEAT_MAP_BASE_HEIGHT_PX + HEAT_MAP_BASE_CELL_PX * cellTypes.length;
}

/**
 * Value format: `${id}~${tissue}~${name}`
 */
export type CellTypeMetadata =
  `${CellTypeSummary["id"]}~${Tissue}~${CellTypeSummary["name"]}`;

/**
 * We need to encode cell type metadata here, so we can use it in onClick event
 */
export function getAllSerializedCellTypeMetadata(
  cellTypes: CellTypeSummary[]
): CellTypeMetadata[] {
  return cellTypes.map(({ id, name, tissue }) => {
    return `${id}~${tissue}~${name}` as CellTypeMetadata;
  });
}

export function deserializeCellTypeMetadata(
  cellTypeMetadata: CellTypeMetadata
): {
  id: string;
  name: string;
  tissue: Tissue;
} {
  const [id, tissue, name] = cellTypeMetadata.split("~");

  return {
    id,
    name,
    tissue,
  };
}

export function checkIsTissue(cellTypeMetadata: CellTypeMetadata): boolean {
  const { name, tissue } = deserializeCellTypeMetadata(cellTypeMetadata);

  return name === tissue;
}

/**
 * Value format: `${name}`
 */
export function getGeneNames(genes: { name: string }[]): string[] {
  return genes.map(({ name }) => name);
}
