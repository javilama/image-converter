"use client";

import React, { useState, useCallback } from "react";
import Dropzone from "../app/components/Dropzone";
import ImageCard from "../app/components/ImageCard";
import Toolbar from "../app/components/Toolbar";
import BulkActions from "../app/components/BulkAction";
import { useImageStore, getKey } from "./store/useImageStore";


export default function Home() {

  const{
    files,
    converted,
    targetFormat,
    isConvertingAll,
    convertProgress,
    names,
    addFiles,
    removeFile,
    clearAllFiles,
    setTargetFormat,
    convertFile,
    convertAll,
    setCustomName,
    renameAll
  } = useImageStore();


  return (
    <main className="container mx-auto pt-10 pb-10">
      <div className="flex flex-col justify-center items-start md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold mb-4 text-center md:text-left" data-testid="title">
            Convertidor de imágenes
          </h1>

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
                  converted={converted.find((c) =>getKey(c.srcFile) === key )}
                  onConvert={() => convertFile(file)}
                  onRemove={() => removeFile(file)}
                  globalConverting={isConvertingAll}
                  customName={names[key] ?? file.name.replace(/\.[^.]+$/, "")}
                  onCustomNameChange={(n) => setCustomName(file, n)}
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
              onConvertAll={convertAll}
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
    </main>
  );
}
