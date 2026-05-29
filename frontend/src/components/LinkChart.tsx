"use client";

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";

interface HistoryData {
  date: string;
  count: number;
}

export default function LinkChart({ slug, title }: { slug: string; title: string }) {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const response = await fetch(`/api/links/${slug}/history`);
        const result = await response.json();
        if (response.ok) {
          setData(result.history);
        } else {
          setError(result.message || "Failed to fetch history");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchHistory();
    }
  }, [slug]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" p={2}>
        {error}
      </Typography>
    );
  }

  const options: Highcharts.Options = {
    title: {
      text: `Click History: ${title}`,
    },
    xAxis: {
      type: "datetime",
      title: {
        text: "Date",
      },
    },
    yAxis: {
      title: {
        text: "Number of Clicks",
      },
      min: 0,
    },
    series: [
      {
        name: "Clicks",
        type: "line",
        data: data.map((d) => [new Date(d.date).getTime(), d.count]),
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </Paper>
  );
}
