import "./ListOfRouteLogos.css";
import RouteLogo from "./RouteLogo";
import { Link } from "react-router-dom";
import { listRoutesURL } from "../../api/api";
import { useHttpData } from "../../hooks/http";
import { Alert_Reference, ListRoutesReply } from "../../api/types";
import { buildStatusFromAlerts } from "../../elements/Alert";

export type ListOfRouteLogosProps = {
  routeIds: string[];
  skipExpress: boolean;
  addLinks: boolean;
};

export default function ListOfRouteLogos(props: ListOfRouteLogosProps) {
  const alertsData = useHttpData(
    listRoutesURL(),
    null,
    ListRoutesReply.fromJSON,
  );
  let routeIdToAlerts: Map<string, Alert_Reference[]> = new Map();
  if (alertsData.response != null) {
    for (const route of alertsData.response.routes) {
      routeIdToAlerts.set(route.id, route.alerts);
    }
  }

  let routeIds = sortRouteIds(props.routeIds);
  let routeLogos = [];
  for (const routeId of routeIds) {
    let alerts: Alert_Reference[] = [];
	const alertsOr = routeIdToAlerts.get(routeId);
	if (alertsOr !== undefined) {
      alerts = alertsOr;
	}
    let statusToColorClass = new Map();
    statusToColorClass.set("SERVICE_CHANGE", "Orange");
    statusToColorClass.set("DELAYS", "Red");
    let status = buildStatusFromAlerts(alerts);
    let statusClasses = "statusCircle " + get(statusToColorClass, status, "");

    if (props.skipExpress && routeId.slice(-1) === "X") {
      continue;
    }
    if (props.addLinks) {
      routeLogos.push(
        <div key={routeId}>
          <Link to={"/routes/" + routeId}>
            <div className={statusClasses} />
            <RouteLogo route={routeId} />
          </Link>
        </div>,
      );
    } else {
      routeLogos.push(
        <div key={routeId}>
          <div className={statusClasses} />
          <RouteLogo route={routeId} />
        </div>,
      );
    }
  }
  return <div className="ListOfRouteLogos">{routeLogos}</div>;
}

export function sortRouteIds(routeIds: string[]): string[] {
  let routeIdsSet = new Set(routeIds);
  let allGroups = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["A", "C", "E"],
    ["B", "D", "F", "M"],
    ["N", "Q", "R", "W"],
    ["J", "Z"],
  ];
  let activeGroups: string[][] = [];
  for (const routeIds of allGroups) {
    let activeGroup: string[] = [];
    for (const routeId of routeIds) {
      if (!routeIdsSet.has(routeId)) {
        continue;
      }
      activeGroup.push(routeId);
      routeIdsSet.delete(routeId);
    }
    if (activeGroup.length > 0) {
      activeGroups.push(activeGroup);
    }
  }
  for (const routeId of routeIdsSet) {
    activeGroups.push([routeId]);
  }
  activeGroups.sort(function (lhs, rhs) {
    if (lhs[0] < rhs[0]) {
      return -1;
    }
    return 1;
  });
  let result: string[] = [];
  for (const group of activeGroups) {
    for (const routeId of group) {
      result.push(routeId);
    }
  }
  return result;
}

function get(m: Map<string, string>, key: string, fallback: string): string {
  const value = m.get(key);
  if (value !== undefined) {
    return value;
  }
  return fallback;
}
