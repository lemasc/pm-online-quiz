import { Fragment, useEffect } from "react";
import { Result } from "./types";

export function ExportDataOutput({ results }: { results?: Result[] }) {
  useEffect(() => {
    setTimeout(() => {
      document
        .querySelectorAll("input")
        .forEach((elem) => (elem.disabled = true));
    }, 100);
  }, [results]);
  return (
    <>
      {results?.map((result, index) => {
        let name: JSX.Element | undefined;
        if (result.name) {
          const Tag: keyof JSX.IntrinsicElements = result.items ? "h3" : "h2";
          name = <Tag key={`name_${result.name}`}>{result.name}</Tag>;
        }
        return (
          <Fragment key={`export_${index}`}>
            {name}
            {result.content && (
              <div
                dangerouslySetInnerHTML={{
                  __html: result.content,
                }}
              ></div>
            )}
            {result.items &&
              result.items.map((v, i) => (
                <div className="space-y-2" key={`export_${index}_item${i}`}>
                  <p>
                    <b>{v.index}.</b>{" "}
                    {(v as any).adminHtml && (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: (v as any).adminHtml,
                        }}
                      />
                    )}
                  </p>
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{ __html: v.content }}
                  ></div>
                </div>
              ))}
          </Fragment>
        );
      })}
    </>
  );
}
