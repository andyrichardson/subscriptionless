import { getOperationRootType } from "graphql";
import { buildResolveInfo, collectFields, ExecutionContext, getFieldDef } from "graphql/execution/execute";
import { addPath } from "graphql/jsutils/Path";
import { ServerClosure } from "../types";

export const getResolverAndArgs = (c: Omit<ServerClosure, 'gateway'>) => (execContext: ExecutionContext) => {
  // Taken from graphql js - https://github.com/graphql/graphql-js/blob/main/src/subscription/subscribe.js#L190
  const type = getOperationRootType(c.schema, execContext.operation);
  const fields = collectFields(
    execContext,
    type,
    execContext.operation.selectionSet,
    Object.create(null),
    Object.create(null),
  );
  const responseNames = Object.keys(fields);
  const responseName = responseNames[0];
  const fieldNodes = fields[responseName];
  const fieldNode = fieldNodes[0];
  const fieldName = fieldNode.name.value;
  const fieldDef = getFieldDef(c.schema, type, fieldName);
  const path = addPath(undefined, responseName, type.name);
  const info = buildResolveInfo(execContext, fieldDef, fieldNodes, type, path);

  return [
    fieldDef,
    null,
    execContext.variableValues,
    execContext.contextValue,
    info
  ];
};