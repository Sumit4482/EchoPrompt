import { useEffect, useState } from "react";
import Header from "@/components/EchoPrompt/Header";
import LibraryPageLayout from "@/components/EchoPrompt/LibraryPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { TrendingUp, Users, BarChart3 } from "lucide-react";

const Analytics = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [trending, setTrending] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const [insightPeriod, setInsightPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [overviewRes, trendingRes, insightsRes, leaderboardRes] = await Promise.all([
          apiService.getOverview(),
          apiService.getTrending(trendPeriod),
          apiService.getUserInsights(insightPeriod),
          apiService.getLeaderboard(10),
        ]);
        if (overviewRes.success) setOverview(overviewRes.data);
        if (trendingRes.success) setTrending(trendingRes.data);
        if (insightsRes.success) setInsights(insightsRes.data);
        if (leaderboardRes.success && leaderboardRes.data) setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error(error);
        toast({ title: "Failed to load analytics", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [trendPeriod, insightPeriod]);

  const platform = overview?.overview;

  return (
    <>
      <Header />
      <LibraryPageLayout
        title="Analytics"
        description="Admin overview: platform stats, trending content, and leaderboard."
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        ) : (
          <Tabs defaultValue="platform" className="space-y-4">
            <TabsList>
              <TabsTrigger value="platform">Platform</TabsTrigger>
              <TabsTrigger value="yours">Your insights</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Users", value: platform?.totalUsers ?? 0, icon: Users },
                  { label: "Public templates", value: platform?.totalTemplates ?? 0, icon: BarChart3 },
                  { label: "Prompts", value: platform?.totalPrompts ?? 0, icon: TrendingUp },
                  { label: "Template uses", value: platform?.totalTemplateUsage ?? 0, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </div>
                      <p className="text-2xl font-bold mt-1">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {overview?.recentActivity && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Last 7 days</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>New templates: {overview.recentActivity.newTemplates}</p>
                    <p>New prompts: {overview.recentActivity.promptsGenerated}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="yours" className="space-y-4">
              <div className="flex gap-2">
                {(["7d", "30d", "90d"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={insightPeriod === p ? "default" : "outline"}
                    onClick={() => setInsightPeriod(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              {insights && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Templates</p>
                      <p className="text-xl font-bold">{insights.templates?.totalTemplates ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insights.templates?.publicTemplates ?? 0} public
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Saved prompts</p>
                      <p className="text-xl font-bold">{insights.prompts?.totalPrompts ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="text-sm mt-1">
                        {insights.prompts?.totalViews ?? 0} views · {insights.prompts?.totalCopies ?? 0} copies
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <div className="flex gap-2">
                {(["24h", "7d", "30d"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={trendPeriod === p ? "default" : "outline"}
                    onClick={() => setTrendPeriod(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trending templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(trending?.templates ?? []).slice(0, 8).map((t: any) => (
                      <div key={t._id} className="flex justify-between text-sm">
                        <span className="truncate">{t.name}</span>
                        <Badge variant="secondary">{t.usageCount ?? 0} uses</Badge>
                      </div>
                    ))}
                    {!trending?.templates?.length && (
                      <p className="text-xs text-muted-foreground">No trending templates in this period.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trending prompts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(trending?.prompts ?? []).slice(0, 8).map((p: any) => (
                      <div key={p._id} className="text-sm">
                        <p className="truncate font-medium">{p.promptData?.task || "Prompt"}</p>
                        <p className="text-xs text-muted-foreground">{p.analytics?.views ?? 0} views</p>
                      </div>
                    ))}
                    {!trending?.prompts?.length && (
                      <p className="text-xs text-muted-foreground">No trending prompts in this period.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top creators by template usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.userId} className="flex items-center justify-between text-sm">
                      <span>
                        #{i + 1}{" "}
                        {entry.firstName || entry.username}
                        {entry.lastName ? ` ${entry.lastName}` : ""}
                      </span>
                      <span className="text-muted-foreground">{entry.totalUsage} uses</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-xs text-muted-foreground">No leaderboard data yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </LibraryPageLayout>
    </>
  );
};

export default Analytics;
