"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BeaconService } from "@/lib/beacon-service";
import { EmailService } from "@/lib/email-service";
import {
    Eye,
    Globe,
    Smartphone,
    Monitor,
    Chrome,
    MapPin,
    Clock,
    TrendingUp,
    Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface BeaconTrackingProps {
    companyId?: string;
    isAdmin?: boolean;
}

export default function BeaconTracking({ companyId, isAdmin = false }: BeaconTrackingProps) {
    const [beaconLogs, setBeaconLogs] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [topEmails, setTopEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch revoked/flagged emails for warning display
    const [revokedEmails, setRevokedEmails] = useState<string[]>([]);
    useEffect(() => {
        // Fetch revoked emails from your backend (Firestore/Appwrite)
        // This is a placeholder, replace with your actual fetch logic
        async function fetchRevokedEmails() {
            // Example: fetch all emails with revoked: true
            // You may want to move this to a service
            try {
                const revoked = await EmailService.getRevokedEmails(companyId);
                setRevokedEmails(revoked);
            } catch (e) {
                setRevokedEmails([]);
            }
        }
        fetchRevokedEmails();
    }, [companyId]);

    const fetchBeaconData = useCallback(async () => {
        try {
            setLoading(true);

            if (!isAdmin && !companyId) {
                setBeaconLogs([]);
                setAnalytics(null);
                setTopEmails([]);
                return;
            }

            const logs = isAdmin
                ? await BeaconService.getAllBeaconLogs(50)
                : await BeaconService.getBeaconLogsByCompany(companyId as string, 50);

            const analyticsData = await BeaconService.getBeaconAnalytics(isAdmin ? undefined : companyId);
            const topEmailsData = await BeaconService.getTopOpenedEmails(isAdmin ? undefined : companyId, 5);

            setBeaconLogs(logs);
            setAnalytics(analyticsData);
            setTopEmails(topEmailsData);
        } catch (error) {
            console.error('Failed to fetch beacon data:', error);
        } finally {
            setLoading(false);
        }
    }, [companyId, isAdmin]);

    useEffect(() => {
        void fetchBeaconData();
    }, [fetchBeaconData]);

    const getBrowserIcon = (browser: string) => {
        switch ((browser || '').toLowerCase()) {
            case 'chrome':
                return <Chrome className="h-4 w-4" />;
            case 'firefox':
                // No Firefox icon in lucide-react, use Globe as fallback
                return <Globe className="h-4 w-4" />;
            case 'safari':
                // No Safari icon in lucide-react, use Globe as fallback
                return <Globe className="h-4 w-4" />;
            default:
                return <Globe className="h-4 w-4" />;
        }
    };

    const getDeviceIcon = (device: string) => {
        switch ((device || '').toLowerCase()) {
            case 'mobile':
            case 'tablet':
                return <Smartphone className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const [topLocationLatLng, setTopLocationLatLng] = useState<{lat: number, lng: number} | null>(null);
    const [topLocationAddress, setTopLocationAddress] = useState<string | null>(null);

    useEffect(() => {
        if (analytics && analytics.topLocationLat && analytics.topLocationLng) {
            setTopLocationLatLng({ lat: analytics.topLocationLat, lng: analytics.topLocationLng });
            // Reverse geocode using Nominatim (OpenStreetMap)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${analytics.topLocationLat}&lon=${analytics.topLocationLng}`)
                .then(res => res.json())
                .then(data => {
                    setTopLocationAddress(data.display_name || null);
                })
                .catch(() => setTopLocationAddress(null));
        }
    }, [analytics]);

    // Find the most opened location from beaconLogs
    const getTopLocationFromLogs = (): Record<string, unknown> | null => {
        if (!beaconLogs.length) return null;
        type Bucket = { count: number; loc: Record<string, unknown> };
        const locationCounts: Record<string, Bucket> = {};
        for (const log of beaconLogs) {
            let loc: Record<string, unknown> = {};
            try {
                loc =
                    typeof log.location === 'string'
                        ? (JSON.parse(log.location) as Record<string, unknown>)
                        : ((log.location as Record<string, unknown>) || {});
            } catch {
                loc = {};
            }
            const hasLatLng = typeof loc.latitude === 'number' && typeof loc.longitude === 'number';
            const key = hasLatLng
                ? `${loc.latitude},${loc.longitude}`
                : `${String(loc.city ?? 'Unknown')},${String(loc.country ?? 'Unknown')}`;
            if (!locationCounts[key]) locationCounts[key] = { count: 0, loc };
            locationCounts[key].count++;
        }
        let top: Bucket | null = null;
        for (const val of Object.values(locationCounts)) {
            if (!top || val.count > top.count) top = val;
        }
        return top?.loc ?? null;
    };

    const topLocation = getTopLocationFromLogs();

    useEffect(() => {
        if (topLocation && typeof topLocation.latitude === 'number' && typeof topLocation.longitude === 'number') {
            // Fetch address from OpenStreetMap Nominatim
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${topLocation.latitude}&lon=${topLocation.longitude}`)
                .then(res => res.json())
                .then(data => {
                    setTopLocationAddress(data.display_name || null);
                })
                .catch(() => setTopLocationAddress(null));
        } else {
            setTopLocationAddress(null);
        }
    }, [topLocation]);

    // Cache for location addresses
    const [locationAddresses, setLocationAddresses] = useState<Record<string, string>>({});

    // Fetch and cache addresses for all unique lat/lngs in beaconLogs
    useEffect(() => {
        const uniqueLatLngs = Array.from(new Set(
            beaconLogs
                .map(log => {
                    let loc: any = {};
                    try {
                        loc = typeof log.location === 'string' ? JSON.parse(log.location) : log.location || {};
                    } catch { loc = {}; }
                    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                        return `${loc.latitude},${loc.longitude}`;
                    }
                    return null;
                })
                .filter(Boolean)
        ));
        uniqueLatLngs.forEach(key => {
            if (key && !locationAddresses[key]) {
                const [lat, lng] = key.split(',');
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    .then(res => res.json())
                    .then(data => {
                        setLocationAddresses(prev => ({ ...prev, [key]: data.display_name || '' }));
                    })
                    .catch(() => {
                        setLocationAddresses(prev => ({ ...prev, [key]: '' }));
                    });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beaconLogs]);

    // Prepare chart data
    const deviceData = Object.entries(analytics?.deviceStats || {}).map(([device, count]) => ({ name: device, value: count }));
    const browserData = Object.entries(analytics?.browserStats || {}).map(([browser, count]) => ({ name: browser, value: count }));
    const opensPerDay = Object.entries(analytics?.opensPerDay || {}).map(([date, count]) => ({ date, count }));
    const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!analytics) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-muted-foreground">No beacon tracking data available.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Show warning for revoked emails */}
            <div className="grid gap-4 md:grid-cols-2">
               
                <Card>
                    <CardHeader>
                        <CardTitle>Device Types</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                    {deviceData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Browser Types</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={browserData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                    {browserData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            {revokedEmails.length > 0 && (
                <Card className="border-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-600">Warning: Some secure links have been disabled due to suspicious activity</CardTitle>
                        <CardDescription>
                            The following emails had their secure links revoked after being opened from multiple devices or locations:
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-6">
                            {revokedEmails.map(emailId => (
                                <li key={emailId} className="text-red-500">Email ID: {emailId}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Analytics Overview */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalOpens}</div>
                        <p className="text-xs text-muted-foreground">
                            +{analytics.recentOpens} in last 7 days
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Opens</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.uniqueOpens}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.openRate}% open rate
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Device</CardTitle>
                        {getDeviceIcon(Object.keys(analytics.deviceStats)[0] || 'desktop')}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(analytics.deviceStats)[0] || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {String(Object.values(analytics.deviceStats)[0] || 0)} opens
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Location</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                          {topLocation &&
                          typeof topLocation.latitude === 'number' &&
                          typeof topLocation.longitude === 'number' ? (
                            <>
                              <span>
                                Lat: {(topLocation.latitude as number).toFixed(4)}, Lng:{' '}
                                {(topLocation.longitude as number).toFixed(4)}
                              </span>
                              {topLocationAddress && (
                                <div className="text-xs text-muted-foreground mt-1">{topLocationAddress}</div>
                              )}
                              {(topLocation.city ?? topLocation.country) ? (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {topLocation.city ? `${String(topLocation.city)}, ` : ''}
                                  {String(topLocation.country ?? '')}
                                </div>
                              ) : null}
                            </>
                          ) : topLocation && (topLocation.city ?? topLocation.country) ? (
                            <span>
                              {String(topLocation.city ?? 'Unknown')}, {String(topLocation.country ?? 'Unknown')}
                            </span>
                          ) : (
                            Object.keys(analytics.locationStats)[0] || 'Unknown'
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {String(Object.values(analytics.locationStats)[0] || 0)} opens
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Opened Emails */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Most Opened Emails
                    </CardTitle>
                    <CardDescription>
                        Emails with the highest open rates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topEmails.length > 0 ? (
                            topEmails.map((email, index) => (
                                <div key={email.emailId ?? `top-${index}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">#{index + 1}</Badge>
                                        <div>
                                            <p className="font-medium">{email.recipientEmail}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Email ID:{' '}
                                                {email.emailId
                                                    ? `${String(email.emailId).slice(0, 8)}…`
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                        {email.openCount} opens
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground">No email opens tracked yet</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Tracking Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Email Opens
                    </CardTitle>
                    <CardDescription>
                        Latest email tracking activity
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {beaconLogs.length > 0 ? (
                      beaconLogs.slice(0, 10).map((log, index) => {
                        let loc: Record<string, unknown> = {};
                        try {
                          loc =
                            typeof log.location === 'string'
                              ? (JSON.parse(log.location) as Record<string, unknown>)
                              : ((log.location as Record<string, unknown>) || {});
                        } catch {
                          loc = {};
                        }
                        const hasLatLng = typeof loc.latitude === 'number' && typeof loc.longitude === 'number';
                        const latLngKey = hasLatLng ? `${loc.latitude},${loc.longitude}` : null;
                        const logKey = (log as { $id?: string; id?: string }).$id ?? (log as { id?: string }).id ?? `log-${index}`;
                        return (
                          <div key={logKey} className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getBrowserIcon(log.browser)}
                                {getDeviceIcon(log.device)}
                              </div>
                              <div>
                                <p className="font-medium">{log.recipientEmail}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{log.device}</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>{log.browser}</span>
                                    <Separator orientation="vertical" className="h-3" />
                                    <span>{log.os}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3 w-3" />
                                {hasLatLng ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="underline decoration-dotted cursor-help">
                                          {(loc.latitude as number).toFixed(4)}, {(loc.longitude as number).toFixed(4)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <span>{locationAddresses[latLngKey!] || 'Loading address...'}</span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span>
                                    {String(loc.city ?? 'Unknown')}, {String(loc.country ?? 'Unknown')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(log.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No tracking activity yet</p>
                    )}
                  </div>
                </CardContent>
            </Card>

            {/* Device & Browser Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Device Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(analytics.deviceStats).map(([device, count]: [string, any]) => (
                                <div key={device} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getDeviceIcon(device)}
                                        <span className="capitalize">{device}</span>
                                    </div>
                                    <Badge variant="secondary">{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Browser Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(analytics.browserStats).map(([browser, count]: [string, any]) => (
                                <div key={browser} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getBrowserIcon(browser)}
                                        <span>{browser}</span>
                                    </div>
                                    <Badge variant="secondary">{count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts row */}
            
        </div>
    );
}
