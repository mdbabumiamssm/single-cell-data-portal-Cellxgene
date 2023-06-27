/**
 * NOTE: If you modify this file, you must update Plausible custom event page for
 * both staging and prod environments as well.
 * Staging: https://plausible.io/cellxgene.staging.single-cell.czi.technology/settings/goals
 * Prod: https://plausible.io/cellxgene.cziscience.com/settings/goals
 */
export enum EVENTS {
  EXPLORE_CZ_CELLXGENE_ANNOTATE_CLICKED = "EXPLORE_CZ_CELLXGENE_ANNOTATE_CLICKED",
  FILTER_SELECT_ASSAY = "FILTER_SELECT_ASSAY",
  FILTER_SELECT_AUTHORS = "FILTER_SELECT_AUTHORS",
  FILTER_SELECT_CELL_COUNT = "FILTER_SELECT_CELL_COUNT",
  FILTER_SELECT_CELL_CLASS = "FILTER_SELECT_CELL_CLASS",
  FILTER_SELECT_CELL_SUBCLASS = "FILTER_SELECT_CELL_SUBCLASS",
  FILTER_SELECT_CELL_TYPE = "FILTER_SELECT_CELL_TYPE",
  FILTER_SELECT_DEVELOPMENT_STAGE = "FILTER_SELECT_DEVELOPMENT_STAGE",
  FILTER_SELECT_DISEASE = "FILTER_SELECT_DISEASE",
  FILTER_SELECT_SELF_REPORTED_ETHNICITY = "FILTER_SELECT_SELF_REPORTED_ETHNICITY",
  FILTER_SELECT_GENE_COUNT = "FILTER_SELECT_GENE_COUNT",
  FILTER_SELECT_ORGAN = "FILTER_SELECT_ORGAN",
  FILTER_SELECT_ORGANISM = "FILTER_SELECT_ORGANISM",
  FILTER_SELECT_PUBLICATION = "FILTER_SELECT_PUBLICATION",
  FILTER_SELECT_PUBLICATION_DATE = "FILTER_SELECT_PUBLICATION_DATE",
  FILTER_SELECT_SEX = "FILTER_SELECT_SEX",
  FILTER_SELECT_SUSPENSION_TYPE = "FILTER_SELECT_SUSPENSION_TYPE",
  FILTER_SELECT_SYSTEM = "FILTER_SELECT_SYSTEM",
  FILTER_SELECT_TISSUE = "FILTER_SELECT_TISSUE",
  WMG_SELECT_GENE = "WMG_SELECT_GENE",
  WMG_SELECT_ORGANISM = "WMG_SELECT_ORGANISM",
  WMG_SELECT_TISSUE = "WMG_SELECT_TISSUE",
  WMG_CLICK_NAV = "WMG_CLICK_NAV",
  WMG_HEATMAP_LOADED = "WMG_HEATMAP_LOADED",
  WMG_CLICKED = "WMG_CLICKED",
  WMG_SHARE_CLICKED = "WMG_SHARE_CLICKED",
  WMG_SHARE_LOADED = "WMG_SHARE_LOADED",
  WMG_DOWNLOAD_CLICKED = "WMG_DOWNLOAD_CLICKED",
  WMG_DOWNLOAD_COMPLETE = "WMG_DOWNLOAD_COMPLETE",
  WMG_FMG_INFO_CLICKED = "WMG_FMG_INFO_CLICKED",
  WMG_FMG_COPY_GENES_CLICKED = "WMG_FMG_COPY_GENES_CLICKED",
  WMG_FMG_ADD_GENES_CLICKED = "WMG_FMG_ADD_GENES_CLICKED",
  WMG_FMG_QUESTION_BUTTON_HOVER = "WMG_FMG_QUESTION_BUTTON_HOVER",
  WMG_FMG_DOCUMENTATION_CLICKED = "WMG_FMG_DOCUMENTATION_CLICKED",
  BROWSE_COLLECTIONS_CLICKED = "BROWSE_COLLECTIONS_CLICKED",
  DATASET_EXPLORE_CLICKED = "DATASET_EXPLORE_CLICKED",
  BROWSE_TUTORIALS_CLICKED = "BROWSE_TUTORIALS_CLICKED",
  CENSUS_CLICK_NAV = "CENSUS_CLICK_NAV",
  DATASETS_CLICK_NAV = "DATASETS_CLICK_NAV",
  COLLECTIONS_CLICK_NAV = "COLLECTIONS_CLICK_NAV",
  DOCUMENTATION_CLICK_NAV = "DOCUMENTATION_CLICK_NAV",
  DOWNLOAD_DATA_CLICKED = "DOWNLOAD_DATA_CLICKED",
  DOWNLOAD_DATA_COMPLETE = "DOWNLOAD_DATA_COMPLETE",
  DOWNLOAD_DATA_COPY = "DOWNLOAD_DATA_COPY",
  DOWNLOAD_DATA_FORMAT_CLICKED = "DOWNLOAD_DATA_FORMAT_CLICKED",
  HOMEPAGE_LEARN_FIND_SINGLE_CELL_DATA_CLICKED = "HOMEPAGE_LEARN_FIND_SINGLE_CELL_DATA_CLICKED",
  HOMEPAGE_LEARN_EXPLORE_GENE_EXPRESSION_CLICKED = "HOMEPAGE_LEARN_EXPLORE_GENE_EXPRESSION_CLICKED",
  HOMEPAGE_LEARN_ANALYZE_DATASETS_CLICKED = "HOMEPAGE_LEARN_ANALYZE_DATASETS_CLICKED",
  HOMEPAGE_LEARN_DOWNLOAD_DATA_CLICKED = "HOMEPAGE_LEARN_DOWNLOAD_DATA_CLICKED",
  HOMEPAGE_LEARN_EXPEDITE_COLLABORATION_CLICKED = "HOMEPAGE_LEARN_EXPEDITE_COLLABORATION_CLICKED",
  VIEW_COLLECTION_PAGE_CLICKED = "VIEW_COLLECTION_PAGE_CLICKED",
  DESKTOP_QUICK_START_DOC_CLICKED = "DESKTOP_QUICK_START_DOC_CLICKED",
  BROWSE_CAREERS_CLICKED = "BROWSE_CAREERS_CLICKED",
  GITHUB_CLICKED = "GITHUB_CLICKED",
  CONTACT_US_CLICKED = "CONTACT_US_CLICKED",
  WMG_HEATMAP_DOT_HOVER = "WMG_HEATMAP_DOT_HOVER",
  FILTER_SELECT_DATASET = "FILTER_SELECT_DATASET",
  WMG_OPTION_SELECT_SORT_GENES = "WMG_OPTION_SELECT_SORT_GENES",
  WMG_OPTION_SELECT_COLOR_SCALE = "WMG_OPTION_SELECT_COLOR_SCALE",
  WMG_OPTION_SELECT_CELL_TYPES = "WMG_OPTION_SELECT_CELL_TYPES",
  WMG_OPTION_SELECT_GROUP_BY = "WMG_OPTION_SELECT_GROUP_BY",
  WMG_DELETE_GENE = "WMG_DELETE_GENE",
  WMG_FMG_NO_MARKER_GENES = "WMG_FMG_NO_MARKER_GENES",
  WMG_GENE_INFO = "WMG_GENE_INFO",
  WMG_FMG_GENE_INFO = "WMG_FMG_GENE_INFO",
  WMG_SOURCE_DATA_CLICKED = "WMG_SOURCE_DATA_CLICKED",
  WMG_SOURCE_DOCUMENTATION_CLICKED = "WMG_SOURCE_DOCUMENTATION_CLICKED",
  CELL_CARDS_CLICK_NAV = "CELL_CARDS_CLICK_NAV",
  NEWSLETTER_EMAIL_SUBMITTED = "NEWSLETTER_EMAIL_SUBMITTED",
  NEWSLETTER_SIGNUP_SUCCESS = "NEWSLETTER_SIGNUP_SUCCESS",
  NEWSLETTER_SIGNUP_FAILURE = "NEWSLETTER_SIGNUP_FAILURE",
  NEWSLETTER_OPEN_MODAL_CLICKED = "NEWSLETTER_OPEN_MODAL_CLICKED",
  NEWSLETTER_DIRECT_LINK_NAVIGATED = "NEWSLETTER_DIRECT_LINK_NAVIGATED",
  NEWSLETTER_SUBSCRIBE_BUTTON_AVAILABLE = "NEWSLETTER_SUBSCRIBE_BUTTON_AVAILABLE",
  WMG_CLEAR_GENES_CLICKED = "WMG_CLEAR_GENES_CLICKED",
  FILTER_SELECT_DATASET_BEFORE_HEATMAP = "FILTER_SELECT_DATASET_BEFORE_HEATMAP",
  FILTER_SELECT_DISEASE_BEFORE_HEATMAP = "FILTER_SELECT_DISEASE_BEFORE_HEATMAP",
  FILTER_SELECT_ETHNICITY_BEFORE_HEATMAP = "FILTER_SELECT_ETHNICITY_BEFORE_HEATMAP",
  FILTER_SELECT_PUBLICATION_BEFORE_HEATMAP = "FILTER_SELECT_PUBLICATION_BEFORE_HEATMAP",
  FILTER_SELECT_SEX_BEFORE_HEATMAP = "FILTER_SELECT_SEX_BEFORE_HEATMAP",
  FILTER_SELECT_DATASET_AFTER_HEATMAP = "FILTER_SELECT_DATASET_AFTER_HEATMAP",
  FILTER_SELECT_DISEASE_AFTER_HEATMAP = "FILTER_SELECT_DISEASE_AFTER_HEATMAP",
  FILTER_SELECT_ETHNICITY_AFTER_HEATMAP = "FILTER_SELECT_ETHNICITY_AFTER_HEATMAP",
  FILTER_SELECT_PUBLICATION_AFTER_HEATMAP = "FILTER_SELECT_PUBLICATION_AFTER_HEATMAP",
  FILTER_SELECT_SEX_AFTER_HEATMAP = "FILTER_SELECT_SEX_AFTER_HEATMAP",
}
