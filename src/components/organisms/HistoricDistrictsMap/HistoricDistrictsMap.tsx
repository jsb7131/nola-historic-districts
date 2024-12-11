'use client'

import { useEffect, useRef, useState, CSSProperties } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import styles from "./HistoricDistrictsMap.module.css";

import { HistoricDistrictCollection, HistoricDistrictProperties, SelectedFeatureData } from '@/types/nola-historic-districts';
import { getRandomPastelColor, getGeometryBounds } from '@/utils/mapGis';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export const HistoricDistrictsMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<Map | null>(null);
    const hoveredId = useRef<number | null>(null);
  
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<SelectedFeatureData | null>(null);
    const [districtData, setDistrictData] = useState<HistoricDistrictCollection | null>(null);
  
    useEffect(() => {
      // Fetch the public GIS data from the client-side for performance
      const fetchData = async () => {
        const baseGisUrl = process.env.NEXT_PUBLIC_GIS_NOLA_API_URL || '';
        const nolaHistoricDistrictsUrl = `${baseGisUrl}/4/query?where=1%3D1&outFields=*&f=geojson&returnTrueCurves=true`;

        try {
          const res = await fetch(nolaHistoricDistrictsUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch district data: ${res.statusText}`);
          }
          const geojson: HistoricDistrictCollection = await res.json();

          // Assign a random pastel color to each feature
          const coloredFeatures = geojson.features.map((f) => {
            const randomColor = getRandomPastelColor();
            f.properties.fillColor = randomColor;
            return f;
          });
    
          // Setting this state will trigger the useEffect hook below that initializes the map
          setDistrictData({
            ...geojson,
            features: coloredFeatures
          });
        } catch (error) {
          console.error('Failed to fetch district data', JSON.stringify(error));
          setError('Failed to load historic district data. Please try again later.');
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    useEffect(() => {
      if (!mapContainer.current || !districtData || error) return;
      if (map.current) return; // prevent re-initialization
  
      try {
        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v10',
          center: [-90.07, 29.95], // Center on New Orleans
          zoom: 12
        });
    
        map.current.on('load', () => {
          if (!map.current) return;
    
          // Add data source
          map.current.addSource('districts', {
            type: 'geojson',
            data: districtData,
            promoteId: 'OBJECTID' // use OBJECTID as the unique identifier
          });
    
          // Add fill layer
          map.current.addLayer({
            id: 'districts-fill',
            type: 'fill',
            source: 'districts',
            paint: {
              'fill-color': ['get', 'fillColor'],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.8,
                0.5
              ]
            }
          });
    
          // Add outline layer
          map.current.addLayer({
            id: 'districts-outline',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': '#000',
              'line-width': 1
            }
          });

          // Add selected outline layer (thicker green)
          map.current.addLayer({
            id: 'districts-selected-outline',
            type: 'line',
            source: 'districts',
            paint: {
              'line-color': '#0f0',
              'line-width': 4
            },
            // Initially no feature is selected
            filter: ['==', ['get', 'OBJECTID'], -1]
          });
    
          setLoading(false);
          addMapEventListeners();
        });
      } catch (error) {
        console.error('Failed to initialize map', JSON.stringify(error));
        setError('Failed to initialize map. Please try again later.');
        setLoading(false);
      }
  
      return () => {
        if (map.current) map.current.remove();
      };
    }, [districtData, error]);

    const addMapEventListeners = () => {
      if (!map.current) return;

      // Hover interactivity
      map.current.on('mousemove', 'districts-fill', (e) => {
        if (!map.current || !map.current.getLayer('districts-fill')) return;

        map.current.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features.length > 0) {
          const f = e.features[0] as mapboxgl.GeoJSONFeature;
          if (f.id && typeof f.id === 'number' && hoveredId.current !== f.id) {
            if (hoveredId.current !== null) {
              map.current.setFeatureState({ source: 'districts', id: hoveredId.current }, { hover: false });
            }
            hoveredId.current = f.id;
            map.current.setFeatureState({ source: 'districts', id: f.id }, { hover: true });
          }
        }
      });
  
      map.current.on('mouseleave', 'districts-fill', () => {
        if (!map.current || !map.current.getLayer('districts-fill')) return;

        map.current.getCanvas().style.cursor = '';

        if (hoveredId.current !== null) {
          map.current.setFeatureState({ source: 'districts', id: hoveredId.current }, { hover: false });
          hoveredId.current = null;
        }
      });
  
      // Click interactivity
      map.current.on('click', 'districts-fill', (e) => {
        if (!map.current || !map.current.getLayer('districts-fill')) return;

        if (e.features && e.features.length > 0) {
          const f = e.features[0] as mapboxgl.GeoJSONFeature;
          const props = f.properties as HistoricDistrictProperties;
          const geometry = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
          const bounds = getGeometryBounds(geometry);
          map.current.fitBounds(bounds, { padding: 100 });

          // Remove hover from previously hovered feature, if any
          if (hoveredId.current !== null) {
            map.current.setFeatureState({ source: 'districts', id: hoveredId.current }, { hover: false });
            hoveredId.current = null;
          }

          // Highlight selected feature with green outline
          if (map.current.getLayer('districts-selected-outline')) {
            map.current.setFilter('districts-selected-outline', ['==', ['get', 'OBJECTID'], f.id]);
          }
          
          // Set the selected feature (Show the popup with the selected feature data)
          setSelectedFeature({
            NAME: props.NAME,
            ORDINANCE: props.ORDINANCE,
            JURISDICTION: props.JURISDICTION
          });
        }
      });
  
      // Click-away to close popup if clicking empty space
      map.current.on('click', (e) => {
        if (!map.current || !map.current.getLayer('districts-fill')) return;

        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['districts-fill']
        });
        if (features.length === 0) {
          // Remove the green outline by resetting the filter
          if (map.current.getLayer('districts-selected-outline')) {
            map.current.setFilter('districts-selected-outline', ['==', ['get', 'OBJECTID'], -1]);
          }
          setSelectedFeature(null);
        }
      });
    }

    const handleClosePopup = () => {
      // Close the popup
      setSelectedFeature(null);
      // Remove green outline
      if (map.current && map.current.getLayer('districts-selected-outline')) {
        map.current.setFilter('districts-selected-outline', ['==', ['get', 'OBJECTID'], -1]);
      }
    };

    // Dynamically style the map based on loading state
    const mapStyle: CSSProperties = {
      width: '100%',
      height: '100%',
      filter: loading ? 'grayscale(100%)' : 'none',
      pointerEvents: loading ? 'none' : 'auto',
      opacity: loading ? 0.5 : 1,
      transition: 'opacity 0.3s ease'
    };
  
    return (
      <div className={styles.wrapper}>
        <div
          ref={mapContainer}
          style={mapStyle}
        />
        {loading && !error && (
          <div className={styles.loading}>Loading...</div>
        )}
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        {selectedFeature && (
          <div className={styles.popup}>
            <button
              className={styles.close}
              onClick={handleClosePopup}
            >
              X
            </button>
            <h4 className={styles.cushion}>Historic District</h4>
            <p><strong>Name:</strong> {selectedFeature.NAME}</p>
            <p><strong>Ordinance:</strong> {selectedFeature.ORDINANCE}</p>
            <p><strong>Jurisdiction:</strong> {selectedFeature.JURISDICTION}</p>
          </div>
        )}
      </div>
    );
  }
