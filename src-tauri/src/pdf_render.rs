use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::{DynamicImage, ImageFormat, ImageReader};
use pdfium_render::prelude::*;
use printpdf::{Mm, Op, PdfDocument as PrintPdfDocument, PdfPage as PrintPdfPage, PdfSaveOptions, Pt, RawImage, XObjectTransform};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufWriter, Cursor};
use std::path::{Path, PathBuf};
use tauri::{path::BaseDirectory, AppHandle, Manager};
use uuid::Uuid;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageThumbnail {
    page: u32,
    data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageFileInfo {
    path: String,
    name: String,
    size: u64,
    width: u32,
    height: u32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImagesToPdfOptions {
    page_size: String,
    orientation: String,
    margin_mm: f32,
    fit_mode: String,
}

fn pdfium_name() -> String {
    Pdfium::pdfium_platform_library_name().to_string_lossy().into_owned()
}

fn pdfium_path(app: &AppHandle) -> Result<PathBuf, String> {
    let name = pdfium_name();
    let mut candidates = Vec::new();
    if let Ok(path) = app.path().resolve(format!("pdfium/{name}"), BaseDirectory::Resource) {
        candidates.push(path);
    }
    if let Ok(current) = std::env::current_dir() {
        candidates.push(current.join("src-tauri").join("resources").join("pdfium").join(&name));
        candidates.push(current.join("resources").join("pdfium").join(&name));
    }
    if let Ok(executable) = std::env::current_exe() {
        if let Some(parent) = executable.parent() {
            candidates.push(parent.join(&name));
            candidates.push(parent.join("pdfium").join(&name));
        }
    }
    candidates.into_iter().find(|path| path.exists()).ok_or_else(|| format!("PDFium runtime not found: {name}"))
}

fn pdfium(app: &AppHandle) -> Result<Pdfium, String> {
    let path = pdfium_path(app)?;
    let bindings = Pdfium::bind_to_library(&path)
        .or_else(|_| Pdfium::bind_to_system_library())
        .map_err(|error| format!("Unable to load PDFium: {error}"))?;
    Ok(Pdfium::new(bindings))
}

fn safe_destination(path: &Path) -> PathBuf {
    if !path.exists() {
        return path.to_path_buf();
    }
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let stem = path.file_stem().and_then(|value| value.to_str()).unwrap_or("output");
    let extension = path.extension().and_then(|value| value.to_str()).unwrap_or_default();
    for index in 2..10000 {
        let file = if extension.is_empty() {
            format!("{stem}-{index}")
        } else {
            format!("{stem}-{index}.{extension}")
        };
        let candidate = parent.join(file);
        if !candidate.exists() {
            return candidate;
        }
    }
    let file = if extension.is_empty() {
        format!("{stem}-{}", Uuid::new_v4())
    } else {
        format!("{stem}-{}.{}", Uuid::new_v4(), extension)
    };
    parent.join(file)
}

fn temp_path(destination: &Path) -> PathBuf {
    let parent = destination.parent().unwrap_or_else(|| Path::new("."));
    parent.join(format!(".davpdf-render-{}.tmp", Uuid::new_v4()))
}

fn selected_pages(document: &PdfDocument<'_>, pages: &[u32]) -> Vec<u32> {
    let count = document.pages().len() as u32;
    if pages.is_empty() {
        return (1..=count).collect();
    }
    pages.iter().copied().filter(|page| *page >= 1 && *page <= count).collect()
}

fn render_page(page: &PdfPage<'_>, dpi: u16) -> Result<DynamicImage, String> {
    let dpi = dpi.clamp(36, 600);
    let width = ((page.width().value * f32::from(dpi)) / 72.0).round().clamp(1.0, 20000.0) as i32;
    let config = PdfRenderConfig::new()
        .set_target_width(width)
        .render_form_data(true)
        .render_annotations(true);
    page.render_with_config(&config)
        .map_err(|error| error.to_string())?
        .as_image()
        .map_err(|error| error.to_string())
}

fn save_rendered_image(image: DynamicImage, destination: &Path, format: &str, jpeg_quality: u8) -> Result<(), String> {
    let temporary = temp_path(destination);
    let result = match format {
        "jpg" | "jpeg" => {
            let file = File::create(&temporary).map_err(|error| error.to_string())?;
            let mut writer = BufWriter::new(file);
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut writer, jpeg_quality.clamp(1, 100));
            encoder.encode_image(&image).map_err(|error| error.to_string())
        }
        "webp" => image.save_with_format(&temporary, ImageFormat::WebP).map_err(|error| error.to_string()),
        _ => image.save_with_format(&temporary, ImageFormat::Png).map_err(|error| error.to_string()),
    };
    if let Err(error) = result {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    fs::rename(&temporary, destination).map_err(|error| {
        let _ = fs::remove_file(&temporary);
        error.to_string()
    })
}

#[tauri::command]
pub fn render_pdf_pages(
    app: AppHandle,
    path: String,
    output_dir: String,
    format: String,
    dpi: u16,
    pages: Vec<u32>,
    password: Option<String>,
    jpeg_quality: u8,
) -> Result<Vec<String>, String> {
    let pdfium = pdfium(&app)?;
    let document = pdfium.load_pdf_from_file(&path, password.as_deref().filter(|value| !value.is_empty())).map_err(|error| error.to_string())?;
    let pages = selected_pages(&document, &pages);
    if pages.is_empty() {
        return Err("No valid pages selected".into());
    }
    let output_dir = PathBuf::from(output_dir);
    fs::create_dir_all(&output_dir).map_err(|error| error.to_string())?;
    let stem = Path::new(&path).file_stem().and_then(|value| value.to_str()).unwrap_or("document");
    let extension = match format.as_str() {
        "jpg" | "jpeg" => "jpg",
        "webp" => "webp",
        _ => "png",
    };
    let mut outputs = Vec::new();
    for page_number in pages {
        let page = document.pages().get((page_number - 1) as i32).map_err(|error| error.to_string())?;
        let image = render_page(&page, dpi)?;
        let requested = output_dir.join(format!("{stem}-page-{page_number:03}.{extension}"));
        let destination = safe_destination(&requested);
        save_rendered_image(image, &destination, extension, jpeg_quality)?;
        outputs.push(destination.to_string_lossy().into_owned());
    }
    Ok(outputs)
}

#[tauri::command]
pub fn render_pdf_thumbnails(
    app: AppHandle,
    path: String,
    pages: Vec<u32>,
    size: u16,
    password: Option<String>,
) -> Result<Vec<PageThumbnail>, String> {
    let pdfium = pdfium(&app)?;
    let document = pdfium.load_pdf_from_file(&path, password.as_deref().filter(|value| !value.is_empty())).map_err(|error| error.to_string())?;
    let pages = selected_pages(&document, &pages);
    let size = i32::from(size.clamp(80, 500));
    let config = PdfRenderConfig::new().thumbnail(size);
    let mut result = Vec::new();
    for page_number in pages {
        let page = document.pages().get((page_number - 1) as i32).map_err(|error| error.to_string())?;
        let image = page.render_with_config(&config).map_err(|error| error.to_string())?.as_image().map_err(|error| error.to_string())?;
        let mut bytes = Cursor::new(Vec::new());
        image.write_to(&mut bytes, ImageFormat::Png).map_err(|error| error.to_string())?;
        result.push(PageThumbnail {
            page: page_number,
            data_url: format!("data:image/png;base64,{}", STANDARD.encode(bytes.into_inner())),
        });
    }
    Ok(result)
}

#[tauri::command]
pub fn inspect_image_files(paths: Vec<String>) -> Result<Vec<ImageFileInfo>, String> {
    let mut result = Vec::new();
    for path in paths {
        let reader = ImageReader::open(&path).map_err(|error| format!("{path}: {error}"))?.with_guessed_format().map_err(|error| format!("{path}: {error}"))?;
        let (width, height) = reader.into_dimensions().map_err(|error| format!("{path}: {error}"))?;
        let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
        let name = Path::new(&path).file_name().and_then(|value| value.to_str()).unwrap_or_default().to_string();
        result.push(ImageFileInfo { path, name, size: metadata.len(), width, height });
    }
    Ok(result)
}

fn page_dimensions(option: &ImagesToPdfOptions, width: usize, height: usize) -> (f32, f32) {
    let mut dimensions = match option.page_size.as_str() {
        "a3" => (297.0, 420.0),
        "letter" => (215.9, 279.4),
        "image" => {
            let width_mm = width as f32 / 96.0 * 25.4;
            let height_mm = height as f32 / 96.0 * 25.4;
            (width_mm, height_mm)
        }
        _ => (210.0, 297.0),
    };
    let landscape = option.orientation == "landscape";
    if landscape && dimensions.0 < dimensions.1 {
        dimensions = (dimensions.1, dimensions.0);
    }
    if !landscape && dimensions.0 > dimensions.1 {
        dimensions = (dimensions.1, dimensions.0);
    }
    dimensions
}

fn mm_to_pt(value: f32) -> f32 {
    value * 72.0 / 25.4
}

#[tauri::command]
pub fn images_to_pdf(paths: Vec<String>, output_path: String, options: ImagesToPdfOptions) -> Result<String, String> {
    if paths.is_empty() {
        return Err("At least one image is required".into());
    }
    let mut document = PrintPdfDocument::new("_davPDF Images");
    let mut pages = Vec::new();
    for path in paths {
        let bytes = fs::read(&path).map_err(|error| format!("{path}: {error}"))?;
        let mut warnings = Vec::new();
        let raw = RawImage::decode_from_bytes(&bytes, &mut warnings).map_err(|error| format!("{path}: {error}"))?;
        let (page_width_mm, page_height_mm) = page_dimensions(&options, raw.width, raw.height);
        let max_margin = (page_width_mm.min(page_height_mm) / 2.0 - 1.0).max(0.0);
        let margin_mm = options.margin_mm.clamp(0.0, max_margin);
        let page_width_pt = mm_to_pt(page_width_mm);
        let page_height_pt = mm_to_pt(page_height_mm);
        let margin_pt = mm_to_pt(margin_mm);
        let available_width = (page_width_pt - margin_pt * 2.0).max(1.0);
        let available_height = (page_height_pt - margin_pt * 2.0).max(1.0);
        let image_width_pt = raw.width as f32 * 72.0 / 96.0;
        let image_height_pt = raw.height as f32 * 72.0 / 96.0;
        let fit_scale = (available_width / image_width_pt).min(available_height / image_height_pt);
        let fill_scale = (available_width / image_width_pt).max(available_height / image_height_pt);
        let scale = if options.fit_mode == "fill" { fill_scale } else { fit_scale };
        let rendered_width = image_width_pt * scale;
        let rendered_height = image_height_pt * scale;
        let x = margin_pt + (available_width - rendered_width) / 2.0;
        let y = margin_pt + (available_height - rendered_height) / 2.0;
        let image_id = document.add_image(&raw);
        let transform = XObjectTransform {
            translate_x: Some(Pt(x)),
            translate_y: Some(Pt(y)),
            scale_x: Some(scale),
            scale_y: Some(scale),
            dpi: Some(96.0),
            ..Default::default()
        };
        pages.push(PrintPdfPage::new(Mm(page_width_mm), Mm(page_height_mm), vec![Op::UseXobject { id: image_id, transform }]));
    }
    let destination = safe_destination(Path::new(&output_path));
    let temporary = temp_path(&destination);
    let mut warnings = Vec::new();
    let bytes = document.with_pages(pages).save(&PdfSaveOptions::default(), &mut warnings);
    fs::write(&temporary, bytes).map_err(|error| error.to_string())?;
    fs::rename(&temporary, &destination).map_err(|error| {
        let _ = fs::remove_file(&temporary);
        error.to_string()
    })?;
    Ok(destination.to_string_lossy().into_owned())
}

