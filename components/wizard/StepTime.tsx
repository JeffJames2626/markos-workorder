"use client";

import { useState } from "react";
import { Card, TimeField, Label } from "@heroui/react";
import { Time } from "@internationalized/date";
import type { TimeValue } from "@heroui/react";
import type { TimerData } from "./types";

function timeValueToMs(tv: TimeValue): number {
  const d = new Date();
  d.setHours(tv.hour, tv.minute, 0, 0);
  return d.getTime();
}

function msToTimeValue(ms: number | null): TimeValue | null {
  if (ms === null) return null;
  const d = new Date(ms);
  return new Time(d.getHours(), d.getMinutes());
}

function calcBillableSecs(clockIn: number | null, clockOut: number | null): number {
  if (clockIn === null || clockOut === null) return 0;
  return Math.max(0, Math.floor((clockOut - clockIn) / 1000));
}

interface StepTimeProps {
  data: TimerData;
  onChange: (data: TimerData) => void;
}

export function StepTime({ data, onChange }: StepTimeProps) {
  const [startTime, setStartTime] = useState<TimeValue | null>(
    msToTimeValue(data.clockInTime)
  );
  const [endTime, setEndTime] = useState<TimeValue | null>(
    msToTimeValue(data.clockOutTime)
  );

  const handleStartChange = (val: TimeValue | null) => {
    setStartTime(val);
    const ms = val ? timeValueToMs(val) : null;
    const secs = calcBillableSecs(ms, data.clockOutTime);
    onChange({ ...data, clockInTime: ms, billableSecs: secs });
  };

  const handleEndChange = (val: TimeValue | null) => {
    setEndTime(val);
    const ms = val ? timeValueToMs(val) : null;
    const secs = calcBillableSecs(data.clockInTime, ms);
    onChange({ ...data, clockOutTime: ms, billableSecs: secs });
  };

  const hrs =
    data.billableSecs > 0 ? (data.billableSecs / 3600).toFixed(2) : null;

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default">
        <Card.Header>
          <Card.Title>Time on Site</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-4">
            <TimeField
              fullWidth
              value={startTime}
              onChange={handleStartChange}
            >
              <Label>Start Time</Label>
              <TimeField.Group fullWidth>
                <TimeField.Input>
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>

            <TimeField
              fullWidth
              value={endTime}
              onChange={handleEndChange}
            >
              <Label>End Time</Label>
              <TimeField.Group fullWidth>
                <TimeField.Input>
                  {(segment) => <TimeField.Segment segment={segment} />}
                </TimeField.Input>
              </TimeField.Group>
            </TimeField>
          </div>
        </Card.Content>
      </Card>

      {hrs && (
        <Card variant="secondary">
          <Card.Content>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Billable time</span>
              <span className="text-foreground font-medium">{hrs} hrs</span>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
