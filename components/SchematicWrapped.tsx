"use client";

import { useSchematicEvents } from "@schematichq/schematic-react";
import { useEffect } from "react";

const SchematicWrapped = ({ children }: { children: React.ReactNode }) => {
  const { identify } = useSchematicEvents();

  useEffect(() => {
    const localUserId = "local-user";
    const userName = "Local User";

    identify({
      company: {
        keys: {
          id: localUserId,
        },
        name: userName,
      },
      keys: {
        id: localUserId,
      },
      name: userName,
    });
  }, [identify]);

  return children;
};

export default SchematicWrapped;
