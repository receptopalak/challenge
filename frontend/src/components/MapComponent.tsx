import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Heatmap as HeatmapLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, Cluster as ClusterSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from 'ol/style';
import { Select } from 'ol/interaction';
import { MapBrowserEvent } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import { Toaster } from 'react-hot-toast';

import { getPlanes } from '../services/api';
import { usePlaneSocket } from '../hooks/usePlaneSocket';
import VehicleDetailPanel from './VehicleDetailPanel';
import PlaneSearch from './PlaneSearch';
import type { PlaneInfo } from '../types';

const planeIconUrl = '/plane.png';

const createPlaneStyle = (color: string, scale: number) => {
    const icon = new Icon({
        src: planeIconUrl,
        color: color,
        scale: scale,
        rotation: 0,
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
    });
    const style = new Style({ image: icon });

    return (feature: FeatureLike) => {
        const bearing = feature.get('bearing') || 0;
        icon.setRotation(bearing * (Math.PI / 180));
        return style;
    };
};

const defaultStyle = createPlaneStyle('rgba(255, 255, 0, 0.9)', 0.8);
const hoverStyle = createPlaneStyle('rgba(51, 153, 255, 0.9)', 1.2);
const selectStyle = createPlaneStyle('rgba(255, 0, 0, 0.9)', 1.2);

const clusterStyleCache: { [key: number]: Style } = {};

const markerStyle = new Style({
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.7)' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
    }),
});

type MapMode = 'normal' | 'cluster' | 'heatmap';
const HEATMAP_ZOOM_THRESHOLD = 10;

const MapComponent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const mapElementRef = useRef<HTMLDivElement>(null);
    const vectorSourceRef = useRef(new VectorSource());
    const markerVectorSourceRef = useRef(new VectorSource());
    const mapRef = useRef<Map | null>(null);
    const selectInteractionRef = useRef<Select | null>(null);

    const [selectedPlane, setSelectedPlane] = useState<PlaneInfo | null>(null);
    const [isMapSelectMode, setIsMapSelectMode] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
    const [mapMode, setMapMode] = useState<MapMode>('normal');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [allPlanes, setAllPlanes] = useState<PlaneInfo[]>([]);
    const mapModeRef = useRef(mapMode);
    mapModeRef.current = mapMode;

    // Use a ref to get the latest value of isMapSelectMode inside OpenLayers event listeners
    const isMapSelectModeRef = useRef(isMapSelectMode);
    isMapSelectModeRef.current = isMapSelectMode;

    const { planeLocations } = usePlaneSocket();

    useEffect(() => {
        markerVectorSourceRef.current.clear();
        if (selectedCoords) {
            const markerFeature = new Feature({
                geometry: new Point(fromLonLat(selectedCoords))
            });
            markerVectorSourceRef.current.addFeature(markerFeature);
        }
    }, [selectedCoords]);
    
    useEffect(() => {
        if (!selectedPlane) {
            setSelectedCoords(null);
        }
    }, [selectedPlane]);

    useEffect(() => {
        // Toggle the Select interaction based on map select mode
        if (selectInteractionRef.current) {
            selectInteractionRef.current.setActive(!isMapSelectMode);
        }
    }, [isMapSelectMode]);

    useLayoutEffect(() => {
        const planeLayer = new VectorLayer({ source: vectorSourceRef.current, style: defaultStyle });
        planeLayer.set('name', 'planeLayer');

        const heatmapLayer = new HeatmapLayer({ source: vectorSourceRef.current, blur: 15, radius: 5 });
        heatmapLayer.set('name', 'heatmapLayer');

        const markerLayer = new VectorLayer({ source: markerVectorSourceRef.current, style: markerStyle });
        markerLayer.set('name', 'markerLayer');

        const initialMap = new Map({
            target: mapElementRef.current!,
            layers: [ new TileLayer({ source: new OSM() }), planeLayer, heatmapLayer, markerLayer ],
            view: new View({ center: fromLonLat([35, 39]), zoom: 6 }),
        });
        
        const view = initialMap.getView();
        const resolutionListenerKey: EventsKey = view.on('change:resolution', () => {
            if (mapModeRef.current !== 'heatmap') return;
            
            const zoom = view.getZoom();
            const isZoomedIn = !!(zoom && zoom > HEATMAP_ZOOM_THRESHOLD);

            planeLayer.setVisible(isZoomedIn);
            heatmapLayer.setVisible(!isZoomedIn);
            selectInteractionRef.current?.setActive(isZoomedIn);
        });

        const selectInteraction = new Select({
            style: (feature) => selectStyle(feature as FeatureLike),
            hitTolerance: 5,
        });
        initialMap.addInteraction(selectInteraction);
        selectInteractionRef.current = selectInteraction; // Store interaction in ref

        selectInteraction.on('select', (event) => {
            // Önceki seçimi temizle
            const deselectedFeatures = event.deselected;
            deselectedFeatures.forEach(feature => {
                feature.setStyle(undefined); // Normal sarı renge döndür
            });

            const selectedFeatures = event.target.getFeatures();
            if (selectedFeatures.getLength() > 0) {
                const selectedFeature = selectedFeatures.item(0);
                const planeProperties = selectedFeature.getProperties();
                const planeInfo: PlaneInfo = {
                    id: planeProperties.id,
                    model: planeProperties.model,
                    tailNumber: planeProperties.tailNumber,
                    altitude: planeProperties.altitude,
                    speed_kmh: planeProperties.speed_kmh,
                    status: planeProperties.status,
                    pilot: planeProperties.pilot,
                };
                setSelectedPlane(planeInfo);
                // Seçili uçağı kırmızı yap
                selectedFeature.setStyle(selectStyle(selectedFeature as FeatureLike));
            } else {
                setSelectedPlane(null);
            }
        });

        let hoveredFeature: Feature | null = null;
        initialMap.on('pointermove', (event) => {
            const cursor = isMapSelectModeRef.current ? 'pointer' : '';
            initialMap.getTargetElement().style.cursor = cursor;

            if (event.dragging || isMapSelectModeRef.current) return;
            
            const featureAtPixel = initialMap.getFeaturesAtPixel(event.pixel, {
                hitTolerance: 5
            })[0] as Feature | undefined;
            
            const planeFeature = featureAtPixel && featureAtPixel.get('model') ? featureAtPixel : null;

            if (planeFeature) {
                if (planeFeature !== hoveredFeature) {
                    if (hoveredFeature) {
                        const isSelected = selectInteraction.getFeatures().getArray().includes(hoveredFeature);
                        if (isSelected) {
                            hoveredFeature.setStyle(selectStyle(hoveredFeature as FeatureLike));
                        } else {
                            hoveredFeature.setStyle(undefined);
                        }
                    }
                    
                    const isSelected = selectInteraction.getFeatures().getArray().includes(planeFeature);
                    if (isSelected) {
                        planeFeature.setStyle(selectStyle(planeFeature as FeatureLike));
                    } else {
                        planeFeature.setStyle(hoverStyle(planeFeature as FeatureLike));
                    }
                    hoveredFeature = planeFeature;
                }
            } else {
                if (hoveredFeature) {
                    const isSelected = selectInteraction.getFeatures().getArray().includes(hoveredFeature);
                    if (isSelected) {
                        hoveredFeature.setStyle(selectStyle(hoveredFeature as FeatureLike));
                    } else {
                        hoveredFeature.setStyle(undefined);
                    }
                    hoveredFeature = null;
                }
            }
        });

        initialMap.on('singleclick', (event) => {
            if (isMapSelectModeRef.current) {
                const coords = toLonLat(event.coordinate) as [number, number];
                setSelectedCoords(coords);
                setIsMapSelectMode(false); 
            }
        });

        const fetchInitialPlanes = async () => {
            try {
                const response = await getPlanes();
                const geojsonFormat = new GeoJSON();
                const features = geojsonFormat.readFeatures(response.data, {
                    featureProjection: 'EPSG:3857',
                });
                vectorSourceRef.current.addFeatures(features);
                
                const planeDetailsList: PlaneInfo[] = geojsonFormat.readFeatures(response.data).map(f => {
                    const props = f.getProperties();
                    // GeoJSON format may read pilot as a string, so we may need to parse it.
                    if (typeof props.pilot === 'string') {
                        try {
                            props.pilot = JSON.parse(props.pilot);
                        } catch(e) {
                            console.error("Pilot information could not be parsed:", props.pilot);
                        }
                    }
                    // Backend'den gelen `properties` alanını direkt kullanalım.
                    // GeoJSON formatı anahtar-değerleri en üst seviyeye çıkarır.
                    return {
                        id: props.id,
                        model: props.model,
                        tailNumber: props.tailNumber,
                        altitude: props.altitude,
                        speed_kmh: props.speed_kmh,
                        status: props.status,
                        pilot: props.pilot,
                    };
                });
                setAllPlanes(planeDetailsList);

                console.log(`${features.length} aircraft loaded to map.`);
            } catch (error) {
                console.error("Error occurred while fetching aircraft:", error);
            }
        };
        fetchInitialPlanes();

        mapRef.current = initialMap;

        return () => {
            unByKey(resolutionListenerKey);
            initialMap.setTarget(undefined);
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const layers = mapRef.current?.getLayers();
        if (!layers) return;

        const planeLayer = layers.getArray().find(l => l.get('name') === 'planeLayer');
        const heatmapLayer = layers.getArray().find(l => l.get('name') === 'heatmapLayer');
        
        if (!planeLayer || !heatmapLayer) return;

        const isNormal = mapMode === 'normal';
        const isHeatmap = mapMode === 'heatmap';

        planeLayer.setVisible(isNormal);
        heatmapLayer.setVisible(isHeatmap);

        if (isHeatmap) {
            const zoom = mapRef.current?.getView().getZoom();
            const isZoomedIn = !!(zoom && zoom > HEATMAP_ZOOM_THRESHOLD);
            heatmapLayer.setVisible(!isZoomedIn);
            planeLayer.setVisible(isZoomedIn);
            selectInteractionRef.current?.setActive(isZoomedIn);
        } else {
            selectInteractionRef.current?.setActive(isNormal);
        }
    }, [mapMode]);

    useEffect(() => {
        if (planeLocations.length === 0 || !vectorSourceRef.current) return;

        planeLocations.forEach(locationData => {
            const feature = vectorSourceRef.current.getFeatureById(locationData.id);
            if (feature) {
                const newCoordinates = fromLonLat(locationData.coordinates);
                (feature.getGeometry() as Point).setCoordinates(newCoordinates);
                
                feature.set('bearing', locationData.bearing);
            }
        });
    }, [planeLocations]);

    const handlePlaneSelect = (planeId: number) => {
        const feature = vectorSourceRef.current.getFeatureById(planeId);
        if (feature && mapRef.current) {
            const geometry = feature.getGeometry() as Point;
            if (geometry) {
                mapRef.current.getView().animate({
                    center: geometry.getCoordinates(),
                    zoom: 14,
                    duration: 1000,
                });

                const selectInteraction = selectInteractionRef.current;
                if (selectInteraction) {
                    const selectedFeatures = selectInteraction.getFeatures();
                    selectedFeatures.clear();
                    selectedFeatures.push(feature);
                    setSelectedPlane(feature.getProperties() as PlaneInfo);
                }
            }
        }
    };

    const isOnMapPage = location.pathname === '/' || location.pathname === '/map';

    return (
        <>
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        fontSize: '16px',
                    },
                    success: {
                        duration: 3000,
                        theme: {
                            primary: 'green',
                            secondary: 'black',
                        },
                    },
                    error: {
                        duration: 4000,
                        theme: {
                            primary: 'red',
                            secondary: 'black',
                        },
                    },
                }}
            />
            <div style={{
                position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 1001, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.9)', padding: '8px',
                    borderRadius: '12px', display: 'flex', gap: '8px', backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <button 
                        onClick={() => setMapMode('normal')} 
                        disabled={mapMode === 'normal'}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: mapMode === 'normal' ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: mapMode === 'normal' ? '#3b82f6' : 'rgba(148, 163, 184, 0.3)',
                            color: mapMode === 'normal' ? 'white' : '#e2e8f0'
                        }}
                        onMouseEnter={(e) => {
                            if (mapMode !== 'normal') {
                                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (mapMode !== 'normal') {
                                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.3)';
                            }
                        }}
                    >
                        Normal
                    </button>
                    <button 
                        onClick={() => setMapMode('heatmap')} 
                        disabled={mapMode === 'heatmap'}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: mapMode === 'heatmap' ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: mapMode === 'heatmap' ? '#3b82f6' : 'rgba(148, 163, 184, 0.3)',
                            color: mapMode === 'heatmap' ? 'white' : '#e2e8f0'
                        }}
                        onMouseEnter={(e) => {
                            if (mapMode !== 'heatmap') {
                                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (mapMode !== 'heatmap') {
                                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.3)';
                            }
                        }}
                    >
                        Density Map
                    </button>
                </div>
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)} 
                    style={{ 
                        background: 'rgba(15, 23, 42, 0.9)', 
                        color: '#e2e8f0', 
                        border: 'none', 
                        borderRadius: '12px', 
                        padding: '12px 18px', 
                        cursor: 'pointer', 
                        backdropFilter: 'blur(10px)',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                        e.currentTarget.style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
                        e.currentTarget.style.color = '#e2e8f0';
                    }}
                >
                    🔍 Search
                </button>
            </div>
            
            <PlaneSearch 
                planes={allPlanes}
                onSelect={handlePlaneSelect}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
            />

            <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                <div ref={mapElementRef} style={{ width: '100%', height: '100%' }} />

                {selectedPlane && (
                    <VehicleDetailPanel 
                        planeDetails={selectedPlane} 
                        onClose={() => setSelectedPlane(null)}
                        onToggleMapSelect={setIsMapSelectMode}
                        onSetCoords={setSelectedCoords}
                        selectedCoords={selectedCoords}
                        mapRef={mapRef.current}
                        
                    />
                )}
            </div>
        </>
    );
};

export default MapComponent;