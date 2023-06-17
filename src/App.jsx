import { Box, Button, Grid, TextField } from "@mui/material";
import "./App.css";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import idBack from "./assets/idBack.jpg";
import Papa from "papaparse";
import JSZip from "jszip";

function App() {
  const { editor, onReady } = useFabricJSEditor();
  const [textFieldId, setTextFieldId] = useState("");
  const [fileName, setFileName] = useState(" Upload csv file");
  const [csvData, setCsvData] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(idBack);

  const fileRef = useRef(null);
  const imageFileRef = useRef(null);

  const setIdAndFocus = (id, ex = () => {}) => {
    let current = editor.canvas._objects.length - 1;
    editor.canvas.item(current).set("id", id);
    ex(current);
    editor.canvas.setActiveObject(editor.canvas.item(current));
  };

  const onAddText = () => {
    if (textFieldId.length === 0) return;
    editor.addText("Text");

    // editor?.canvas.add(
    //   new fabric.Text(textFieldId, {
    //     fontFamily: "Poppins",
    //   })
    // );

    setIdAndFocus(textFieldId, (current) => {
      editor.canvas.item(current).set("text", textFieldId);
    });
    editor.canvas.renderAll();
    setTextFieldId("");
  };

  const onDelete = () => {
    editor.deleteSelected();
    editor.canvas.renderAll();
  };

  const handleUploadClick = () => {
    fileRef.current.click();
  };

  const onFileSelect = (e) => {
    setFileName(e.target.files[0].name);

    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const csv = Papa.parse(target.result, { header: true });
      const parsedData = csv?.data;
      setCsvData(parsedData);
      console.log(parsedData);
    };

    reader.readAsText(file);
  };

  const zipAndDownload = (imageStrings) => {
    const zip = new JSZip();
    for (let i = 0; i < imageStrings.length; i++) {
      zip.file(`image${i}.png`, imageStrings[i], { base64: true });
    }
    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "images.zip";
      link.click();
    });
  };

  const onCLickGenerateAndDownload = () => {
    const objects = editor.canvas._objects;
    const data = csvData;
    const imageStrings = [];

    for (let i = 0; i < data.length; i++) {
      objects.forEach((object) => {
        if (object.id) {
          const id = object.id;
          const text = data[i][id];
          if (text) {
            object.set("text", text);
          }
        }
      });
      editor.canvas.renderAll();
      const dataUrl = editor.canvas.toDataURL({
        format: "png",
        quality: 1,
      });
      const image = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");

      imageStrings.push(image);
    }

    zipAndDownload(imageStrings);
  };

  const downloadCSV = (array) => {
    var csv = Papa.unparse(array);

    var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var csvURL = null;
    if (navigator.msSaveBlob) {
      csvURL = navigator.msSaveBlob(csvData, "download.csv");
    } else {
      csvURL = window.URL.createObjectURL(csvData);
    }

    var tempLink = document.createElement("a");
    tempLink.href = csvURL;
    tempLink.setAttribute("download", "sample csv file.csv");
    tempLink.click();
  };

  const generateAndDownloadSample = () => {
    const objects = editor.canvas._objects;
    const csvTemplate = {};
    objects.forEach((object) => {
      if (object.id) {
        csvTemplate[object.id] = "";
      }
    });
    downloadCSV([csvTemplate]);
  };

  const changeBackground = (e) => {
    const file = e.target.files[0];
    if (editor) {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      setBackgroundImage(image.src);
    }
  };

  const onClickChangeBackground = () => {
    imageFileRef.current.click();
  };

  const setBackgroundRatios = (image, ratio, editor) => {
    editor.canvas.setHeight(image.height * ratio);
    editor.canvas.setWidth(image.width * ratio);
    editor.canvas.setBackgroundImage(
      image,
      () => {
        editor.canvas.renderAll();
      },
      {
        scaleX: editor.canvas.width / image.width,
        scaleY: editor.canvas.height / image.height,
      }
    );
  };

  useEffect(() => {
    if (editor) {
      fabric.Image.fromURL(backgroundImage, (image) => {
        const ratio = Math.min(600 / image.width, 600 / image.height);
        setBackgroundRatios(image, ratio, editor);
      });
      console.log(editor.canvas._objects);
    }
  }, [editor]);

  return (
    <Box
      sx={{
        minWidth: "100vw",
        minHeight: "100vh",
        backgroundColor: "#0f120c",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <input type="file" ref={fileRef} onChange={onFileSelect} hidden />
      <input
        type="file"
        ref={imageFileRef}
        onChange={changeBackground}
        hidden
      />
      <Grid container>
        <Grid item xs={12} sm={7} display={"flex"} justifyContent={"center"}>
          <FabricJSCanvas className="sample-canvas" onReady={onReady} />
        </Grid>
        <Grid item xs={12} sm={4} display={"flex"} alignItems={"center"}>
          <Box>
            <Box display={"flex"} gap={2}>
              <Box flexGrow={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Text field id"
                  sx={{ backgroundColor: "#a4aab9", borderRadius: "5px" }}
                  value={textFieldId}
                  onChange={(e) => setTextFieldId(e.target.value)}
                />
              </Box>
              <Button variant="contained" onClick={onAddText}>
                Add Text
              </Button>
              <Button variant="contained" onClick={onDelete}>
                Delete
              </Button>
            </Box>

            <Box
              my={2}
              display={"flex"}
              flexDirection={"column"}
              height={"170px"}
              justifyContent={"center"}
              alignItems={"center"}
              border={"1px solid #fff"}
            >
              <Button onClick={handleUploadClick}>{fileName}</Button>
              <Button variant="text" onClick={generateAndDownloadSample}>
                Dowload Sample CSV
              </Button>
            </Box>
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Button variant="outlined" onClick={onClickChangeBackground}>
                Change Background
              </Button>
              <Button variant="contained" onClick={onCLickGenerateAndDownload}>
                Generate & Download
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={1}></Grid>
      </Grid>
    </Box>
  );
}

export default App;
