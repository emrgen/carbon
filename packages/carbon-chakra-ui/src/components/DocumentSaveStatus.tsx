import { Spinner, Square } from "@chakra-ui/react";
import { useCarbon } from "@emrgen/carbon-react";
import { useEffect, useState } from "react";
import { BiSync } from "react-icons/bi";

export const DocumentSaveStatus = () => {
  const app = useCarbon();
  const [isSaving, setIsSaving] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    const onSaving = () => {
      setIsSaving(true);
      setIsSaved(false);
    };

    const onSaved = () => {
      setIsSaving(false);
      setIsSaved(true);
      setIsChanged(false);
    };

    const onChanged = () => {
      setIsChanged(true);
      setIsSaved(false);
      setIsSaving(false);
    };

    app.on("external:saving", onSaving);
    app.on("external:saved", onSaved);
    app.on("external:changed", onChanged);

    return () => {
      app.off("external:saving", onSaving);
      app.off("external:saved", onSaved);
      app.off("external:changed", onChanged);
    };
  }, [app]);

  return (
    <Square
      fontSize={"md"}
      bg={"#eee"}
      size={6}
      borderRadius={4}
      pos={"relative"}
    >
      {!isSaving && isChanged && <BiSync color={"red"} />}
      {isSaving && <Spinner size={"xs"} />}
      {!isChanged && isSaved && <BiSync color={"green"} />}
    </Square>
  );
};