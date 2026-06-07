import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapArea from '../components/MapArea';
import SearchBar from '../components/Search/SearchBar';
import { t } from '../utils/i18n';
import styles from './HomePage.module.css';

const HomePage = () => {
    const navigation = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem('role');
        const cafeId = localStorage.getItem('cafeId');

        if (userRole === 'OWNER') {
            if (cafeId && cafeId !== 'null' && cafeId !== 'undefined') {
                navigation('/owner/dashboard');
            } else {
                navigation('/owner/management');
            }
        }
    }, [navigation]);

    const [cafes, setCafes] = useState(() => {
        const savedCafes = sessionStorage.getItem('savedCafes');
        return savedCafes ? JSON.parse(savedCafes) : [];
    });
    const [routeData, setRouteData] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState(() => {
        return sessionStorage.getItem('savedKeyword') || '';
    });
    const [sheetExpanded, setSheetExpanded] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const keywordFromUrl = searchParams.get('keyword');

    const destLatRaw = searchParams.get('destLat');
    const destLngRaw = searchParams.get('destLng');
    const destNameRaw = searchParams.get('destName');

    const routeTarget = useMemo(() => {
        if (destLatRaw == null || destLngRaw == null) return null;
        const lat = Number(destLatRaw);
        const lng = Number(destLngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng, name: destNameRaw || null };
    }, [destLatRaw, destLngRaw, destNameRaw]);

    const isRoutingView = Boolean(routeData || routeTarget);
    const mapResizeSignal = `${sheetExpanded}-${isRoutingView}-${cafes.length}`;

    useEffect(() => {
        if (!keywordFromUrl) return;
        setSearchKeyword(keywordFromUrl);
        setSheetExpanded(true);
    }, [keywordFromUrl]);

    useEffect(() => {
        if (isRoutingView) setSheetExpanded(true);
    }, [isRoutingView]);

    useEffect(() => {
        sessionStorage.setItem('savedCafes', JSON.stringify(cafes));
        sessionStorage.setItem('savedKeyword', searchKeyword);
    }, [cafes, searchKeyword]);

    const translateStep = (step) => {
        if (step.maneuver.type === 'depart') return t('depart');
        if (step.maneuver.type === 'arrive') return t('arriveDestination');

        switch (step.maneuver.modifier) {
            case 'left': return t('turnLeft');
            case 'right': return t('turnRight');
            case 'straight': return t('goStraight');
            case 'slight left': return t('keepLeft');
            case 'slight right': return t('keepRight');
            case 'sharp left': return t('sharpLeft');
            case 'sharp right': return t('sharpRight');
            case 'uturn': return t('uTurn');
            default: return t('continue');
        }
    };

    const formatDuration = (durationInMinutes) => {
        const minutes = Number(durationInMinutes);
        if (!Number.isFinite(minutes) || minutes < 0) return '';

        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        const remainingMinutes = minutes % 60;
        const parts = [];

        if (days > 0) parts.push(`${days} ${t('day')}`);
        if (hours > 0) parts.push(`${hours} ${t('hour')}`);
        if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes} ${t('minute')}`);

        return parts.join(' ');
    };

    const clearRoute = () => {
        setRouteData(null);
        const next = new URLSearchParams(searchParams);
        next.delete('destLat');
        next.delete('destLng');
        next.delete('destName');
        setSearchParams(next);
    };

    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <div className={`${styles.sidebar} ${sheetExpanded ? styles.sidebarExpanded : ''}`}>
                    <button
                        type="button"
                        className={styles.sheetHandle}
                        aria-label={sheetExpanded ? t('back') : t('searchPlaceholder')}
                        aria-expanded={sheetExpanded}
                        onClick={() => setSheetExpanded((value) => !value)}
                    />

                    {isRoutingView && (
                        <div className={styles.routePanel}>
                            <div className={styles.routeHeader}>
                                <button onClick={clearRoute} className={styles.backButton}>
                                    ← {t('back')}
                                </button>
                                <h3 className={styles.routeTitle}>{t('routeGuide')}</h3>
                            </div>

                            {routeData ? (
                                <>
                                    <div className={styles.routeSummary}>
                                        <h2 className={styles.routeDistance}>
                                            {routeData.distance} km <span className={styles.routeDuration}>/ {formatDuration(routeData.duration)}</span>
                                        </h2>
                                        <p className={styles.routeNote}>{t('trafficMayVary')}</p>
                                    </div>

                                    <div className={styles.routeSteps}>
                                        <ul className={styles.routeList}>
                                            {routeData.steps.map((step, idx) => (
                                                <li key={idx} className={styles.routeStep}>
                                                    <div className={styles.routeStepText}>
                                                        <span style={{ fontWeight: 'bold' }}>{translateStep(step)}</span>
                                                        {step.name && <div className={styles.routeStepName}>{step.name}</div>}
                                                    </div>
                                                    <div className={styles.routeStepDistance}>
                                                        {step.distance > 0 ? `${step.distance} m` : ''}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.routeWaiting}>
                                    <p className={styles.waitingTitle}>{t('waitingForLocation')}</p>
                                    {routeTarget?.name && (
                                        <p className={styles.waitingTarget}>
                                            {t('routeTarget')}: {routeTarget.name}
                                        </p>
                                    )}
                                    <p className={styles.waitingText}>{t('locationPermissionRequired')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.searchPanel} style={{ display: isRoutingView ? 'none' : 'block' }}>
                        <SearchBar
                            onSearchData={setCafes}
                            initialKeyword={searchKeyword}
                            onKeywordChange={setSearchKeyword}
                        />
                    </div>
                </div>

                <div className={styles.mapPane}>
                    <MapArea
                        cafes={cafes}
                        onRouteCalculated={setRouteData}
                        isRouting={isRoutingView}
                        routeTarget={routeTarget}
                        resizeSignal={mapResizeSignal}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;
