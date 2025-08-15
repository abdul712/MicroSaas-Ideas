"use client";

import React, { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeTypes,
} from "react-flow-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailSequenceNode, WorkflowEdge } from "@/types";
import { Plus, Save, Play, Pause } from "lucide-react";

// Custom node components
const EmailNode = ({ data, id }: { data: any; id: string }) => {
  const metrics = data.metrics || { sent: 0, opened: 0, clicked: 0, replied: 0 };
  const openRate = metrics.sent > 0 ? (metrics.opened / metrics.sent) * 100 : 0;
  const clickRate = metrics.sent > 0 ? (metrics.clicked / metrics.sent) * 100 : 0;

  return (
    <Card className="min-w-[250px] border-2 border-blue-200 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {data.templateName || "Template"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {data.subject || "Email subject line"}
          </p>
          {metrics.sent > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Sent:</span>
                <span className="font-medium">{metrics.sent}</span>
              </div>
              <div className="flex justify-between">
                <span>Open Rate:</span>
                <span className="font-medium">{openRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Clicked:</span>
                <span className="font-medium">{metrics.clicked}</span>
              </div>
              <div className="flex justify-between">
                <span>Click Rate:</span>
                <span className="font-medium">{clickRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DelayNode = ({ data }: { data: any }) => {
  return (
    <Card className="min-w-[200px] border-2 border-yellow-200 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <CardTitle className="text-sm font-medium">Delay</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-600">
            {data.delayDays || 0}d {data.delayHours || 0}h
          </div>
          <p className="text-xs text-gray-500">Wait time</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ConditionNode = ({ data }: { data: any }) => {
  return (
    <Card className="min-w-[200px] border-2 border-purple-200 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <CardTitle className="text-sm font-medium">Condition</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            {data.condition || "If condition met"}
          </p>
          <div className="text-xs text-gray-500">
            Then: Continue | Else: Stop
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TriggerNode = ({ data }: { data: any }) => {
  return (
    <Card className="min-w-[200px] border-2 border-green-200 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <CardTitle className="text-sm font-medium">Trigger</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-sm font-bold">{data.triggerType || "Manual"}</p>
          <p className="text-xs text-gray-500">
            {data.description || "Sequence start point"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const WebhookNode = ({ data }: { data: any }) => {
  return (
    <Card className="min-w-[200px] border-2 border-red-200 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <CardTitle className="text-sm font-medium">Webhook</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            {data.webhookUrl ? "POST to URL" : "Configure webhook"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {data.webhookUrl || "No URL set"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  trigger: TriggerNode,
  webhook: WebhookNode,
};

interface WorkflowBuilderProps {
  sequenceId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onActivate?: () => void;
  onPause?: () => void;
  isActive?: boolean;
  readOnly?: boolean;
}

export function WorkflowBuilder({
  sequenceId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onActivate,
  onPause,
  isActive = false,
  readOnly = false,
}: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string>("email");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          ...getDefaultDataForType(type),
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const getDefaultDataForType = (type: string) => {
    switch (type) {
      case "email":
        return {
          subject: "New Email",
          templateName: "Select Template",
          metrics: { sent: 0, opened: 0, clicked: 0, replied: 0 },
        };
      case "delay":
        return { delayDays: 1, delayHours: 0 };
      case "condition":
        return { condition: "Email was opened" };
      case "trigger":
        return { triggerType: "Manual", description: "Start sequence manually" };
      case "webhook":
        return { webhookUrl: "" };
      default:
        return {};
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const handleActivate = () => {
    if (onActivate) {
      onActivate();
    }
  };

  const handlePause = () => {
    if (onPause) {
      onPause();
    }
  };

  // Initialize with a trigger node if no nodes exist
  useEffect(() => {
    if (nodes.length === 0 && !readOnly) {
      const triggerNode: Node = {
        id: "trigger-start",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: {
          label: "Sequence Start",
          triggerType: "Manual",
          description: "Sequence starting point",
        },
      };
      setNodes([triggerNode]);
    }
  }, [nodes.length, readOnly, setNodes]);

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
          
          {!readOnly && (
            <Panel position="top-right">
              <Card className="p-4 bg-white">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Add Nodes</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNode("email")}
                        className="text-xs"
                      >
                        + Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNode("delay")}
                        className="text-xs"
                      >
                        + Delay
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNode("condition")}
                        className="text-xs"
                      >
                        + Condition
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNode("webhook")}
                        className="text-xs"
                      >
                        + Webhook
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <Button
                        onClick={handleSave}
                        size="sm"
                        className="w-full"
                        disabled={!onSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      
                      {isActive ? (
                        <Button
                          onClick={handlePause}
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={!onPause}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          onClick={handleActivate}
                          size="sm"
                          variant="default"
                          className="w-full"
                          disabled={!onActivate}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Panel>
          )}
          
          {readOnly && (
            <Panel position="top-right">
              <Card className="p-3 bg-white">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}