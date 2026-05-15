"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    forwardRef,
} from "react";
import maplibregl, {
    Map as MapLibreMap,
    MapOptions,
    LngLatLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus, Maximize, Navigation, Compass } from "lucide-react";
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

export interface MapViewport {
    center: [number, number];
    zoom: number;
    bearing?: number;
    pitch?: number;
}

// ─── Theme Detection ──────────────────────────────────────────────────────────

function useDetectedTheme(): Theme {
    const [theme, setTheme] = useState<Theme>(() => {
        // SSR-safe initial detection
        if (typeof document === "undefined") return "light";
        return document.documentElement.classList.contains("dark") ||
            document.documentElement.getAttribute("data-theme") === "dark"
            ? "dark"
            : "light";
    });

    useEffect(() => {
        const detect = (): Theme => {
            const el = document.documentElement;
            if (
                el.classList.contains("dark") ||
                el.getAttribute("data-theme") === "dark"
            )
                return "dark";
            if (
                el.classList.contains("light") ||
                el.getAttribute("data-theme") === "light"
            )
                return "light";
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        };

        setTheme(detect());

        // Watch class/attribute changes on <html>
        const observer = new MutationObserver(() => setTheme(detect()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"],
        });

        // Watch system preference
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onMq = () => setTheme(detect());
        mq.addEventListener("change", onMq);

        return () => {
            observer.disconnect();
            mq.removeEventListener("change", onMq);
        };
    }, []);

    return theme;
}

// ─── Tile Styles ──────────────────────────────────────────────────────────────

const TILE_STYLES: Record<Theme, string> = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface MapContextValue {
    map: MapLibreMap | null;
    isLoaded: boolean;
}

const MapContext = createContext<MapContextValue>({ map: null, isLoaded: false });

export function useMap() {
    return useContext(MapContext);
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export interface MapProps {
    children?: React.ReactNode;
    className?: string;
    /** Override detected theme */
    theme?: Theme;
    /** Custom tile style URLs per theme */
    styles?: { light?: string; dark?: string };
    /** Controlled or initial viewport */
    viewport?: Partial<MapViewport>;
    onViewportChange?: (viewport: MapViewport) => void;
    loading?: boolean;
    // Standard MapLibre options forwarded
    center?: LngLatLike;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    bearing?: number;
    pitch?: number;
    onLoad?: (map: MapLibreMap) => void;
    onClick?: (e: maplibregl.MapMouseEvent) => void;
}

export const Map = forwardRef<HTMLDivElement, MapProps>(
    (
        {
            children,
            className = "",
            theme: themeProp,
            styles: stylesProp,
            viewport,
            onViewportChange,
            loading = false,
            center,
            zoom = 2,
            minZoom,
            maxZoom,
            bearing,
            pitch,
            onLoad,
            onClick,
        },
        ref
    ) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const mapRef = useRef<MapLibreMap | null>(null);
        const [isLoaded, setIsLoaded] = useState(false);
        const detectedTheme = useDetectedTheme();
        const activeTheme = themeProp ?? detectedTheme;

        // Merge ref
        useEffect(() => {
            if (typeof ref === "function") ref(containerRef.current);
            else if (ref)
                (ref as React.MutableRefObject<HTMLDivElement | null>).current =
                    containerRef.current;
        }, [ref]);

        const getStyle = useCallback(
            (t: Theme) =>
                (t === "dark" ? stylesProp?.dark : stylesProp?.light) ??
                TILE_STYLES[t],
            [stylesProp]
        );

        // Init map once
        useEffect(() => {
            if (!containerRef.current || mapRef.current) return;

            const initCenter =
                viewport?.center ?? (center as [number, number]) ?? [0, 0];
            const initZoom = viewport?.zoom ?? zoom;

            const options: MapOptions = {
                container: containerRef.current,
                style: getStyle(activeTheme),
                center: initCenter,
                zoom: initZoom,
                bearing: viewport?.bearing ?? bearing ?? 0,
                pitch: viewport?.pitch ?? pitch ?? 0,
                ...(minZoom !== undefined && { minZoom }),
                ...(maxZoom !== undefined && { maxZoom }),
                attributionControl: false,
            };

            const map = new maplibregl.Map(options);
            mapRef.current = map;

            map.on("load", () => {
                setIsLoaded(true);
                onLoad?.(map);
            });

            if (onClick) map.on("click", onClick);

            if (onViewportChange) {
                const fire = () => {
                    const c = map.getCenter();
                    onViewportChange({
                        center: [c.lng, c.lat],
                        zoom: map.getZoom(),
                        bearing: map.getBearing(),
                        pitch: map.getPitch(),
                    });
                };
                map.on("move", fire);
            }

            return () => {
                map.remove();
                mapRef.current = null;
                setIsLoaded(false);
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Sync theme → swap tile style without recreating map
        useEffect(() => {
            if (!mapRef.current) return;
            mapRef.current.setStyle(getStyle(activeTheme));
        }, [activeTheme, getStyle]);

        // Sync controlled viewport
        useEffect(() => {
            if (!viewport || !mapRef.current) return;
            if (viewport.center)
                mapRef.current.setCenter(viewport.center);
            if (viewport.zoom !== undefined)
                mapRef.current.setZoom(viewport.zoom);
            if (viewport.bearing !== undefined)
                mapRef.current.setBearing(viewport.bearing);
            if (viewport.pitch !== undefined)
                mapRef.current.setPitch(viewport.pitch);
        }, [viewport]);

        return (
            <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
                <div
                    ref={containerRef}
                    className={`relative w-full h-full ${className}`}
                    style={{ minHeight: 200 }}
                >
                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow">
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Memuat peta...
                            </div>
                        </div>
                    )}

                    {/* Re-provide context after map is available */}
                    {isLoaded && mapRef.current ? (
                        <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
                            {children}
                        </MapContext.Provider>
                    ) : (
                        children
                    )}
                </div>
            </MapContext.Provider>
        );
    }
);
Map.displayName = "Map";

// ─── MapControls ──────────────────────────────────────────────────────────────

export interface MapControlsProps {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    showZoom?: boolean;
    showCompass?: boolean;
    showLocate?: boolean;
    showFullscreen?: boolean;
    className?: string;
    onLocate?: (coords: { longitude: number; latitude: number }) => void;
}

export function MapControls({
    position = "bottom-right",
    showZoom = true,
    showCompass = false,
    showLocate = false,
    showFullscreen = false,
    className = "",
    onLocate,
}: MapControlsProps) {
    const { map } = useMap();

    const positionClasses: Record<string, string> = {
        "top-right": "top-2 right-2",
        "top-left": "top-2 left-2",
        "bottom-right": "bottom-6 right-2",
        "bottom-left": "bottom-6 left-2",
    };

    const btnClass =
        "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors";
    const iconClass = "w-4 h-4 text-zinc-700 dark:text-zinc-200";

    const zoomIn = () => map?.zoomIn();
    const zoomOut = () => map?.zoomOut();
    const resetBearing = () => map?.resetNorth();
    const fullscreen = () => {
        const el = map?.getContainer();
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen();
        else document.exitFullscreen();
    };
    const locate = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords = {
                longitude: pos.coords.longitude,
                latitude: pos.coords.latitude,
            };
            map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1500 });
            onLocate?.(coords);
        });
    };

    if (!map) return null;

    return (
        <div
            className={`absolute ${positionClasses[position]} z-10 flex flex-col gap-1 ${className}`}
        >
            {showZoom && (
                <>
                    <button onClick={zoomIn} title="Zoom in" className={btnClass}>
                        <Plus className={iconClass} />
                    </button>
                    <button onClick={zoomOut} title="Zoom out" className={btnClass}>
                        <Minus className={iconClass} />
                    </button>
                </>
            )}
            {showCompass && (
                <button onClick={resetBearing} title="Reset bearing" className={btnClass}>
                    <Compass className={iconClass} />
                </button>
            )}
            {showLocate && (
                <button onClick={locate} title="Lokasi saya" className={btnClass}>
                    <Navigation className={iconClass} />
                </button>
            )}
            {showFullscreen && (
                <button onClick={fullscreen} title="Fullscreen" className={btnClass}>
                    <Maximize className={iconClass} />
                </button>
            )}
        </div>
    );
}

// ─── MarkerContext ────────────────────────────────────────────────────────────

interface MarkerContextValue {
    marker: maplibregl.Marker | null;
}
const MarkerContext = createContext<MarkerContextValue>({ marker: null });

// ─── MapMarker ────────────────────────────────────────────────────────────────

export interface MapMarkerProps {
    longitude: number;
    latitude: number;
    children?: React.ReactNode;
    draggable?: boolean;
    onClick?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
    onDragStart?: (lngLat: { lng: number; lat: number }) => void;
    onDrag?: (lngLat: { lng: number; lat: number }) => void;
    onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
}

export function MapMarker({
    longitude,
    latitude,
    children,
    draggable = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onDragStart,
    onDrag,
    onDragEnd,
}: MapMarkerProps) {
    const { map } = useMap();
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const elRef = useRef<HTMLDivElement>(document.createElement("div"));

    useEffect(() => {
        if (!map) return;

        const marker = new maplibregl.Marker({
            element: elRef.current,
            draggable,
        })
            .setLngLat([longitude, latitude])
            .addTo(map);

        markerRef.current = marker;

        const el = marker.getElement();
        if (onClick) el.addEventListener("click", onClick);
        if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
        if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);
        if (onDragStart) marker.on("dragstart", () => onDragStart(marker.getLngLat()));
        if (onDrag) marker.on("drag", () => onDrag(marker.getLngLat()));
        if (onDragEnd) marker.on("dragend", () => onDragEnd(marker.getLngLat()));

        return () => {
            marker.remove();
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {
        markerRef.current?.setLngLat([longitude, latitude]);
    }, [longitude, latitude]);



    return (
        <MarkerContext.Provider value={{ marker: markerRef.current }}>
            {createPortal(children, elRef.current)}
        </MarkerContext.Provider>
    );
}

// ─── MarkerContent ────────────────────────────────────────────────────────────

export interface MarkerContentProps {
    children?: React.ReactNode;
    className?: string;
}

export function MarkerContent({ children, className = "" }: MarkerContentProps) {
    if (!children) {
        return (
            <div className={`h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow ${className}`} />
        );
    }
    return <div className={className}>{children}</div>;
}

// ─── MarkerLabel ──────────────────────────────────────────────────────────────

export interface MarkerLabelProps {
    children: React.ReactNode;
    className?: string;
    position?: "top" | "bottom";
}

export function MarkerLabel({ children, className = "", position = "top" }: MarkerLabelProps) {
    return (
        <div
            className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-xs font-semibold shadow-sm ${
                position === "top" ? "bottom-full mb-1" : "top-full mt-1"
            } ${className}`}
        >
            {children}
        </div>
    );
}

// ─── MarkerPopup ─────────────────────────────────────────────────────────────

export interface MarkerPopupProps {
    children?: React.ReactNode;
    className?: string;
    closeButton?: boolean;
    offset?: maplibregl.PopupOptions["offset"];
    anchor?: maplibregl.PopupOptions["anchor"];
}

export function MarkerPopup({
    children,
    className = "",
    closeButton = false,
    offset = 25,
    anchor,
}: MarkerPopupProps) {
    const { map } = useMap();
    const { marker } = useContext(MarkerContext);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!map || !marker) return;

        const container = document.createElement("div");
        containerRef.current = container;

        const popup = new maplibregl.Popup({
            closeButton,
            offset,
            anchor,
            className: "mapcn-popup",
        })
            .setDOMContent(container);

        popupRef.current = popup;
        marker.setPopup(popup);

        return () => {
            popup.remove();
            popupRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, marker]);

    if (!containerRef.current) return null;


    return createPortal(
        <div className={`p-2 text-sm text-zinc-800 dark:text-zinc-100 ${className}`}>
            {children}
        </div>,
        containerRef.current
    );
}

// ─── MarkerTooltip ────────────────────────────────────────────────────────────

export interface MarkerTooltipProps {
    children?: React.ReactNode;
    className?: string;
}

export function MarkerTooltip({ children, className = "" }: MarkerTooltipProps) {
    const { map } = useMap();
    const { marker } = useContext(MarkerContext);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!map || !marker) return;

        const container = document.createElement("div");
        containerRef.current = container;

        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
            className: "mapcn-tooltip",
        }).setDOMContent(container);

        const el = marker.getElement();
        el.addEventListener("mouseenter", () => popup.addTo(map));
        el.addEventListener("mouseleave", () => popup.remove());

        popupRef.current = popup;

        return () => {
            popup.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, marker]);

    if (!containerRef.current) return null;


    return createPortal(
        <div className={`px-2 py-1 text-xs text-zinc-800 dark:text-zinc-100 ${className}`}>
            {children}
        </div>,
        containerRef.current
    );
}

// ─── MapPopup ─────────────────────────────────────────────────────────────────

export interface MapPopupProps {
    longitude: number;
    latitude: number;
    children?: React.ReactNode;
    onClose?: () => void;
    className?: string;
    closeButton?: boolean;
    anchor?: maplibregl.PopupOptions["anchor"];
    offset?: maplibregl.PopupOptions["offset"];
}

export function MapPopup({
    longitude,
    latitude,
    children,
    onClose,
    className = "",
    closeButton = false,
    anchor,
    offset,
}: MapPopupProps) {
    const { map } = useMap();
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!map) return;

        const container = document.createElement("div");
        containerRef.current = container;

        const popup = new maplibregl.Popup({
            closeButton,
            anchor,
            offset,
            className: "mapcn-popup",
        })
            .setLngLat([longitude, latitude])
            .setDOMContent(container)
            .addTo(map);

        if (onClose) popup.on("close", onClose);
        popupRef.current = popup;

        return () => {
            popup.remove();
            popupRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {
        popupRef.current?.setLngLat([longitude, latitude]);
    }, [longitude, latitude]);

    if (!containerRef.current) return null;


    return createPortal(
        <div className={`p-2 text-sm text-zinc-800 dark:text-zinc-100 ${className}`}>
            {children}
        </div>,
        containerRef.current
    );
}

// ─── MapRoute ─────────────────────────────────────────────────────────────────

export interface MapRouteProps {
    id?: string;
    coordinates: [number, number][];
    color?: string;
    width?: number;
    opacity?: number;
    dashArray?: [number, number];
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    interactive?: boolean;
}

export function MapRoute({
    id,
    coordinates,
    color = "#4285F4",
    width = 3,
    opacity = 0.8,
    dashArray,
    onClick,
    onMouseEnter,
    onMouseLeave,
    interactive = true,
}: MapRouteProps) {
    const { map, isLoaded } = useMap();
    const idRef = useRef(id ?? "route-" + Math.random().toString(36).slice(2));

    useEffect(() => {
        if (!map || !isLoaded || coordinates.length < 2) return;
        const sid = idRef.current;
        const lid = sid + "-layer";

        map.addSource(sid, {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates },
            },
        });

        map.addLayer({
            id: lid,
            type: "line",
            source: sid,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": color,
                "line-width": width,
                "line-opacity": opacity,
                ...(dashArray && { "line-dasharray": dashArray }),
            },
        });

        if (interactive) {
            if (onClick) map.on("click", lid, onClick);
            if (onMouseEnter) map.on("mouseenter", lid, onMouseEnter);
            if (onMouseLeave) map.on("mouseleave", lid, onMouseLeave);
        }

        return () => {
            if (interactive) {
                if (onClick) map.off("click", lid, onClick);
                if (onMouseEnter) map.off("mouseenter", lid, onMouseEnter);
                if (onMouseLeave) map.off("mouseleave", lid, onMouseLeave);
            }
            if (map.getLayer(lid)) map.removeLayer(lid);
            if (map.getSource(sid)) map.removeSource(sid);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isLoaded]);

    // Update coordinates
    useEffect(() => {
        if (!map || !isLoaded) return;
        const source = map.getSource(idRef.current) as maplibregl.GeoJSONSource | undefined;
        source?.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
        });
    }, [coordinates, map, isLoaded]);

    return null;
}