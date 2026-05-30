import TopNavTabs from '../components/layout/TopNavTabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getSearchHistory,
    removeSearchHistory,
    clearSearchHistory
} from '../utils/userLocalStore';
import styles from './profile/ProfilePage.module.css';
import { t } from '../utils/i18n';

const formatTime = (iso) => {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return '';
    }
};

const SearchHistoryPage = () => {
    const [items, setItems] = useState(getSearchHistory());
    const navigate = useNavigate();

    const handleSearchAgain = (keyword) => {
        navigate(`/?keyword=${encodeURIComponent(keyword)}`);
    };
    const handleDelete = (keyword, at) => {
        removeSearchHistory(keyword, at);

        setItems(prev =>
            prev.filter(
                item => !(item.keyword === keyword && item.at === at)
            )
        );
    };
    const handleClearAll = () => {
        if (!window.confirm(t('clearHistoryConfirm'))) return;

        clearSearchHistory();
        setItems([]);
    };
    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#fdf8f5' }}>

            <div className={styles.page}>
                <div className={styles.container} style={{ display: 'block' }}>
                    <div className={`${styles.card} ${styles.mainCard}`}>
                        <h1 className={styles.pageTitle}>{t('searchHistory')}</h1>

                        {items.length === 0 ? (
                            <p className={styles.subText}>{t('noSearchHistory')}</p>
                        ) : (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {items.map((item) => (
                                    <div
                                        key={`${item.keyword}-${item.at}`}
                                        className={styles.card}
                                        style={{
                                            padding: 14,
                                            borderRadius: 12,
                                            boxShadow: 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 12
                                        }}
                                    >
                                        <div
                                            style={{ flex: 1, cursor: 'pointer' }}
                                            onClick={() => handleSearchAgain(item.keyword)}
                                        >
                                            <div style={{ fontWeight: 700, color: '#333' }}>
                                                🔍 {item.keyword}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#757575',
                                                    marginTop: 6
                                                }}
                                            >
                                                {formatTime(item.at)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(item.keyword, item.at)}
                                            style={{
                                                border: 'none',
                                                background: '#fee2e2',
                                                color: '#dc2626',
                                                padding: '8px 10px',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 700
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchHistoryPage;
