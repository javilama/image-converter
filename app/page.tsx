// app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Dropzone from "../app/components/Dropzone";
import ImageCard from "../app/components/ImageCard";
import Toolbar from "../app/components/Toolbar";
import BulkActions from "../app/components/BulkAction";
import AlertModal from "./components/AlertModal";
import { useImageStore, getKey } from "./store/useImageStore";

// --- Componente Principal entrada ---
export default function Home() {

  // Estado globalizado con Zustand
  const{
    files,
    converted,
    targetFormat,
    isConvertingAll,
    convertProgress,
    names,
    addFiles,
    removeFile,
    //clearAllFiles,
    setTargetFormat,
    convertFile,
    convertAll,
    setCustomName,
    renameAll,
    conversionError,
    setConversionError
  } = useImageStore();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const handleConvertAll = async () => {
    // Llamamos a la acción del store; el store se encargará de setear conversionError si ocurre.
    await convertAll();
  };

  // Cuando conversionError cambie en el store abrimos el modal en Home
  useEffect(() => {
    if (conversionError) {
      setAlertMsg(conversionError);
      setAlertOpen(true);
    }
  }, [conversionError]);

  // Cuando el usuario cierra el modal limpiamos el error en el store y el estado local
  const handleCloseAlert = () => {
    setConversionError(null);
    setAlertOpen(false);
    setAlertMsg("");
  };

  // --- Renderizado ---
  return (
    <main className="container mx-auto pt-10 pb-10">
      <div className="flex flex-col justify-center items-start md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold mb-4 text-center md:text-left" data-testid="title">
            Convertidor de imágenes
          </h1>
        { /*--- Dropzone y Lista de Imágenes ---*/}
          <Dropzone
            files={files}
            converted={converted}
            onFilesAdded={addFiles}
            onConvert={convertFile}
            onRemove={removeFile}
            globalConverting={isConvertingAll}
            names={names}
            onCustomNameChange={setCustomName}
          />
          <section className="mt-6 hidden md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const key = getKey(file);
              return (
                <ImageCard
                  key={key}
                  file={file}
                  onConvert={() => convertFile(file)}
                  onRemove={() => removeFile(file)}
                  globalConverting={isConvertingAll}
                  data-testid={`image-card-${file.name}`}
                />
              );
            })}
          </section>
        </div>

        <aside className="w-full md:w-75 shrink-0 mt-30 sticky top-24 h-fit">
          <div className="p-5 rounded-lg bg-white/5 border border-white/6">
            <Toolbar
              targetFormat={targetFormat}
              onChangeFormat={setTargetFormat}
              onConvertAll={handleConvertAll}
              hasFiles={files.length > 0}
              isConvertingAll={isConvertingAll}
              convertProgress={convertProgress}
              data-testid="toolbar"
            />

            <div className="mt-4">
              <BulkActions
                data-testid="bulk-actions-sidebar"
                vertical
                hasFiles={files.length > 0}
                onRenameAllParams={renameAll}
              />
            </div>
          </div>
        </aside>
      </div>
      <AlertModal
        open={alertOpen}
        message={alertMsg}
        onClose={handleCloseAlert}
      />
    </main>
  );
}
