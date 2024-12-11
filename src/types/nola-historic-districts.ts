// Define the properties that appear on the features
export interface HistoricDistrictProperties {
    OBJECTID: number;
    NAME: string;
    ORDINANCE: string;
    JURISDICTION: string;
    CONTROL: string;
    fillColor?: string;
}
  
// The data returned from the endpoint is GeoJSON
export type HistoricDistrictCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, HistoricDistrictProperties>;
  
// For the popup info
export interface SelectedFeatureData {
    NAME: string;
    ORDINANCE: string;
    JURISDICTION: string;
}
