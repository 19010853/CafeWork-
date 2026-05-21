import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavTabs from '../components/layout/TopNavTabs';
import { getBookmarks } from '../utils/userLocalStore';
import { getCafeById } from '../services/cafeService';
import styles from './profile/ProfilePage.module.css';

const MyListPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cafes, setCafes] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const ids = getBookmarks();
                if (ids.length === 0) {
                    if (!cancelled) setCafes([]);
                    return;
                }

                const results = await Promise.all(
                    ids.map(async (id) => {
                        try {
                            return await getCafeById(id);
                        } catch {
                            return null;
                        }
                    })
                );

                if (!cancelled) setCafes(results.filter(Boolean));
            } catch (e) {
                if (!cancelled) setError(e?.message || 'エラーが発生しました。');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#fdf8f5' }}>

            <div className={styles.page}>
                <div className={styles.container} style={{ display: 'block' }}>
                    <div className={`${styles.card} ${styles.mainCard}`}>
                        <h1 className={styles.pageTitle}>マイリスト</h1>

                        {loading && <p className={styles.subText}>読み込み中...</p>}
                        {error && <p className={styles.errorText}>{error}</p>}

                        {!loading && !error && cafes.length === 0 && (
                            <p className={styles.subText}>まだ保存したカフェがありません。</p>
                        )}

                        {!loading && !error && cafes.length > 0 && (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {cafes.map((cafe) => (
                                    <button
                                        key={cafe.id}
                                        type="button"
                                        className={styles.secondaryButton}
                                        style={{
                                            textAlign: 'left',
                                            padding: 14,
                                            borderRadius: 12,
                                            backgroundColor: '#fff',
                                        }}
                                        onClick={() => navigate(`/cafes/${cafe.id}`)}
                                    >
                                        <div style={{ fontWeight: 700, color: '#333' }}>{cafe.name}</div>
                                        <div style={{ fontSize: 13, color: '#757575', marginTop: 6 }}>{cafe.address}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyListPage;
