import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { Workplace, User, PointLog } from '../types';
import { CameraCapture } from '../components/CameraCapture';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';

// Haversine formula to calculate distance between two points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

interface EmployeeDashboardProps {
    user: User;
    onLogout: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, onLogout }) => {
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
    const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [logs, setLogs] = useState<PointLog[]>([]);
    const [earnings, setEarnings] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testMode, setTestMode] = useState(false);

    useEffect(() => {
        api.getWorkplaces().then(setWorkplaces);
        refreshStats();
    }, []);

    useEffect(() => {
        let interval: any;
        interval = setInterval(updateLocation, 5000);
        updateLocation();
        return () => clearInterval(interval);
    }, [selectedWorkplace, testMode]);

    const refreshStats = async () => {
        const stats = await api.getUserStats(user.id);
        setLogs(stats.logs);
        setEarnings(stats.earnings);
    };

    const updateLocation = () => {
        if (testMode && selectedWorkplace) {
            const mockLoc = { lat: selectedWorkplace.latitude, lng: selectedWorkplace.longitude };
            setLocation(mockLoc);
            setDistance(0);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation(newLoc);
                if (selectedWorkplace) {
                    const d = getDistance(newLoc.lat, newLoc.lng, selectedWorkplace.latitude, selectedWorkplace.longitude);
                    setDistance(d);
                }
            },
            (err) => {
                if (!testMode) {
                    setError("Erro ao obter localização. Verifique as permissões ou use o Modo de Teste.");
                }
            },
            { enableHighAccuracy: true }
        );
    };

    const handleRegisterPoint = async (type: 'in' | 'out') => {
        if (!selectedWorkplace || !location || !photo) return;

        if (distance !== null && distance > selectedWorkplace.radius_meters) {
            setError(`Você está fora do perímetro (${Math.round(distance)}m). Aproxime-se do local.`);
            return;
        }

        setLoading(true);
        try {
            await api.registerPoint({
                userId: user.id,
                workplaceId: selectedWorkplace.id,
                type,
                latitude: location.lat,
                longitude: location.lng,
                photo
            });
            setPhoto(null);
            refreshStats();
            alert(`Ponto de ${type === 'in' ? 'entrada' : 'saída'} registrado com sucesso!`);
        } catch (err) {
            setError("Erro ao registrar ponto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            header={
                <Header
                    user={user}
                    onLogout={onLogout}
                    testMode={testMode}
                    onToggleTestMode={() => setTestMode(!testMode)}
                />
            }
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <StatsCard
                    label="Saldo Acumulado"
                    value={`R$ ${earnings.toFixed(2)}`}
                    icon={DollarSign}
                />
                <StatsCard
                    label="Último Ponto"
                    value={logs[0] ? new Date(logs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    icon={Clock}
                    iconColor="text-blue-600"
                />
            </div>

            {/* Geofencing Card */}
            <Card className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Local de Trabalho</h3>
                    <Navigation className={`w-5 h-5 ${location ? 'text-emerald-500 animate-pulse' : 'text-zinc-300'}`} />
                </div>

                <select
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={selectedWorkplace?.id || ''}
                    onChange={(e) => {
                        const wp = workplaces.find(w => w.id === parseInt(e.target.value));
                        setSelectedWorkplace(wp || null);
                    }}
                >
                    <option value="">Selecione o local...</option>
                    {workplaces.map(wp => (
                        <option key={wp.id} value={wp.id}>{wp.name}</option>
                    ))}
                </select>

                {selectedWorkplace && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${distance !== null && distance <= selectedWorkplace.radius_meters ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {distance !== null && distance <= selectedWorkplace.radius_meters ? (
                            <MapPin className="w-5 h-5 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-medium">
                                {distance !== null
                                    ? distance <= selectedWorkplace.radius_meters
                                        ? "Dentro do perímetro"
                                        : `Fora do perímetro (${Math.round(distance)}m)`
                                    : "Calculando distância..."}
                            </p>
                            <p className="text-xs opacity-80">Raio permitido: {selectedWorkplace.radius_meters}m</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Action Section */}
            <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 px-1">Registro de Ponto</h3>

                <CameraCapture onCapture={setPhoto} />

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        disabled={!photo || !selectedWorkplace}
                        loading={loading}
                        onClick={() => handleRegisterPoint('in')}
                    >
                        ENTRADA
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={!photo || !selectedWorkplace}
                        loading={loading}
                        onClick={() => handleRegisterPoint('out')}
                    >
                        SAÍDA
                    </Button>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-24 left-6 right-6 bg-red-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between animate-bounce z-50">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="p-1">✕</button>
                </div>
            )}
        </Layout>
    );
};
