use lopdf::encryption::{EncryptionState, EncryptionVersion, Permissions};
use lopdf::{dictionary, Dictionary, Document, Object, ObjectId, SaveOptions};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfInfo {
    path: String,
    name: String,
    size: u64,
    pages: u32,
    version: String,
    encrypted: bool,
    title: Option<String>,
    author: Option<String>,
    subject: Option<String>,
    keywords: Option<String>,
    creator: Option<String>,
    producer: Option<String>,
    creation_date: Option<String>,
    modification_date: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageRotation {
    page: u32,
    degrees: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataUpdate {
    title: Option<String>,
    author: Option<String>,
    subject: Option<String>,
    keywords: Option<String>,
    creator: Option<String>,
    producer: Option<String>,
    remove_all: bool,
}

fn safe_destination(path: &Path) -> PathBuf {
    if !path.exists() {
        return path.to_path_buf();
    }
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let stem = path.file_stem().and_then(|v| v.to_str()).unwrap_or("output");
    let extension = path.extension().and_then(|v| v.to_str()).unwrap_or("pdf");
    for index in 2..10000 {
        let candidate = parent.join(format!("{}-{}.{}", stem, index, extension));
        if !candidate.exists() {
            return candidate;
        }
    }
    parent.join(format!("{}-{}.{}", stem, Uuid::new_v4(), extension))
}

fn temp_path(destination: &Path) -> PathBuf {
    let parent = destination.parent().unwrap_or_else(|| Path::new("."));
    parent.join(format!(".davpdf-{}.tmp", Uuid::new_v4()))
}

fn save_document(mut document: Document, requested: &Path, modern: bool) -> Result<String, String> {
    let destination = safe_destination(requested);
    let temporary = temp_path(&destination);
    let result = if modern {
        let mut file = File::create(&temporary).map_err(|error| error.to_string())?;
        document.save_modern(&mut file).map(|_| ())
    } else {
        document.save(&temporary).map(|_| ())
    };
    if let Err(error) = result {
        let _ = fs::remove_file(&temporary);
        return Err(error.to_string());
    }
    fs::rename(&temporary, &destination).map_err(|error| {
        let _ = fs::remove_file(&temporary);
        error.to_string()
    })?;
    Ok(destination.to_string_lossy().into_owned())
}

fn load_document(path: &str, password: Option<&str>) -> Result<Document, String> {
    match password.filter(|value| !value.is_empty()) {
        Some(password) => Document::load_with_password(path, password).map_err(|error| error.to_string()),
        None => Document::load(path).map_err(|error| error.to_string()),
    }
}

#[tauri::command]
pub fn inspect_pdf(path: String, password: Option<String>) -> Result<PdfInfo, String> {
    let metadata = match password.as_deref().filter(|value| !value.is_empty()) {
        Some(password) => Document::load_metadata_with_password(&path, password),
        None => Document::load_metadata(&path),
    }
    .map_err(|error| error.to_string())?;
    let file_metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    let name = Path::new(&path).file_name().and_then(|value| value.to_str()).unwrap_or_default().to_string();
    Ok(PdfInfo {
        path,
        name,
        size: file_metadata.len(),
        pages: metadata.page_count,
        version: metadata.version,
        encrypted: metadata.encrypted,
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: metadata.keywords,
        creator: metadata.creator,
        producer: metadata.producer,
        creation_date: metadata.creation_date,
        modification_date: metadata.modification_date,
    })
}

fn merge_documents(paths: &[String]) -> Result<Document, String> {
    if paths.len() < 2 {
        return Err("At least two PDF files are required".into());
    }
    let mut max_id = 1;
    let mut document_pages = BTreeMap::<ObjectId, Object>::new();
    let mut document_objects = BTreeMap::<ObjectId, Object>::new();
    let mut output = Document::with_version("1.5");
    for path in paths {
        let mut document = Document::load(path).map_err(|error| format!("{}: {}", path, error))?;
        if document.was_encrypted() {
            return Err(format!("{} requires a password before it can be merged", path));
        }
        document.renumber_objects_with(max_id);
        max_id = document.max_id + 1;
        for (_, object_id) in document.get_pages() {
            let object = document.get_object(object_id).map_err(|error| error.to_string())?.to_owned();
            document_pages.insert(object_id, object);
        }
        document_objects.extend(document.objects);
    }
    let mut catalog_object: Option<(ObjectId, Object)> = None;
    let mut pages_object: Option<(ObjectId, Object)> = None;
    for (object_id, object) in &document_objects {
        match object.type_name().unwrap_or(b"") {
            b"Catalog" => {
                let id = catalog_object.as_ref().map(|value| value.0).unwrap_or(*object_id);
                catalog_object = Some((id, object.clone()));
            }
            b"Pages" => {
                if let Ok(dictionary) = object.as_dict() {
                    let mut dictionary = dictionary.clone();
                    if let Some((_, old_object)) = &pages_object {
                        if let Ok(old_dictionary) = old_object.as_dict() {
                            dictionary.extend(old_dictionary);
                        }
                    }
                    let id = pages_object.as_ref().map(|value| value.0).unwrap_or(*object_id);
                    pages_object = Some((id, Object::Dictionary(dictionary)));
                }
            }
            b"Page" | b"Outlines" | b"Outline" => {}
            _ => {
                output.objects.insert(*object_id, object.clone());
            }
        }
    }
    let pages_object = pages_object.ok_or("Pages root not found")?;
    let catalog_object = catalog_object.ok_or("Catalog root not found")?;
    for (object_id, object) in &document_pages {
        if let Ok(dictionary) = object.as_dict() {
            let mut dictionary = dictionary.clone();
            dictionary.set("Parent", pages_object.0);
            output.objects.insert(*object_id, Object::Dictionary(dictionary));
        }
    }
    if let Ok(dictionary) = pages_object.1.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Count", document_pages.len() as u32);
        dictionary.set("Kids", document_pages.keys().map(|object_id| Object::Reference(*object_id)).collect::<Vec<_>>());
        output.objects.insert(pages_object.0, Object::Dictionary(dictionary));
    }
    if let Ok(dictionary) = catalog_object.1.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Pages", pages_object.0);
        dictionary.remove(b"Outlines");
        output.objects.insert(catalog_object.0, Object::Dictionary(dictionary));
    }
    output.trailer.set("Root", catalog_object.0);
    output.max_id = output.objects.keys().map(|value| value.0).max().unwrap_or(1);
    output.renumber_objects();
    output.compress();
    Ok(output)
}

#[tauri::command]
pub fn merge_pdfs(paths: Vec<String>, output_path: String) -> Result<String, String> {
    let document = merge_documents(&paths)?;
    save_document(document, Path::new(&output_path), true)
}

fn pages_to_delete(document: &Document, keep_pages: &[u32]) -> Vec<u32> {
    document.get_pages().keys().copied().filter(|page| !keep_pages.contains(page)).collect()
}

#[tauri::command]
pub fn extract_pages(path: String, output_path: String, pages: Vec<u32>, password: Option<String>) -> Result<String, String> {
    if pages.is_empty() {
        return Err("Select at least one page".into());
    }
    let mut document = load_document(&path, password.as_deref())?;
    let remove = pages_to_delete(&document, &pages);
    document.delete_pages(&remove);
    document.prune_objects();
    document.compress();
    save_document(document, Path::new(&output_path), true)
}

#[tauri::command]
pub fn split_pdf(path: String, output_dir: String, groups: Vec<Vec<u32>>, password: Option<String>) -> Result<Vec<String>, String> {
    if groups.is_empty() {
        return Err("No page groups were provided".into());
    }
    fs::create_dir_all(&output_dir).map_err(|error| error.to_string())?;
    let stem = Path::new(&path).file_stem().and_then(|value| value.to_str()).unwrap_or("document");
    let mut outputs = Vec::new();
    for (index, pages) in groups.iter().enumerate() {
        if pages.is_empty() {
            continue;
        }
        let mut document = load_document(&path, password.as_deref())?;
        let remove = pages_to_delete(&document, pages);
        document.delete_pages(&remove);
        document.prune_objects();
        document.compress();
        let destination = Path::new(&output_dir).join(format!("{}-part-{}.pdf", stem, index + 1));
        outputs.push(save_document(document, &destination, true)?);
    }
    Ok(outputs)
}

fn rebuild_page_tree(document: &mut Document, order: &[u32], rotations: &[PageRotation]) -> Result<(), String> {
    let existing = document.get_pages();
    let mut kids = Vec::new();
    let pages_id = document.new_object_id();
    for page_number in order {
        let page_id = *existing.get(page_number).ok_or_else(|| format!("Page {} does not exist", page_number))?;
        let page = document.get_object_mut(page_id).map_err(|error| error.to_string())?;
        let dictionary = page.as_dict_mut().map_err(|error| error.to_string())?;
        dictionary.set("Parent", pages_id);
        if let Some(rotation) = rotations.iter().find(|rotation| rotation.page == *page_number) {
            let normalized = ((rotation.degrees % 360) + 360) % 360;
            dictionary.set("Rotate", normalized);
        }
        kids.push(Object::Reference(page_id));
    }
    document.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => order.len() as u32 }));
    let catalog = document.catalog_mut().map_err(|error| error.to_string())?;
    catalog.set("Pages", pages_id);
    document.prune_objects();
    Ok(())
}

#[tauri::command]
pub fn reorder_rotate_pages(path: String, output_path: String, order: Vec<u32>, rotations: Vec<PageRotation>, password: Option<String>) -> Result<String, String> {
    if order.is_empty() {
        return Err("At least one page must remain".into());
    }
    let mut document = load_document(&path, password.as_deref())?;
    rebuild_page_tree(&mut document, &order, &rotations)?;
    document.compress();
    save_document(document, Path::new(&output_path), true)
}

#[tauri::command]
pub fn compress_pdf(path: String, output_path: String, compression_level: u8, password: Option<String>) -> Result<String, String> {
    let mut document = load_document(&path, password.as_deref())?;
    document.compress();
    let destination = safe_destination(Path::new(&output_path));
    let temporary = temp_path(&destination);
    let options = SaveOptions::builder()
        .use_object_streams(true)
        .use_xref_streams(true)
        .max_objects_per_stream(200)
        .compression_level(u32::from(compression_level.min(9)))
        .build();
    let mut file = File::create(&temporary).map_err(|error| error.to_string())?;
    if let Err(error) = document.save_with_options(&mut file, options) {
        let _ = fs::remove_file(&temporary);
        return Err(error.to_string());
    }
    fs::rename(&temporary, &destination).map_err(|error| error.to_string())?;
    Ok(destination.to_string_lossy().into_owned())
}

fn set_info_value(dictionary: &mut Dictionary, key: &str, value: &Option<String>) {
    match value.as_ref().map(|value| value.trim()).filter(|value| !value.is_empty()) {
        Some(value) => dictionary.set(key, Object::string_literal(value)),
        None => {
            dictionary.remove(key.as_bytes());
        }
    }
}

#[tauri::command]
pub fn update_metadata(path: String, output_path: String, update: MetadataUpdate, password: Option<String>) -> Result<String, String> {
    let mut document = load_document(&path, password.as_deref())?;
    if update.remove_all {
        document.trailer.remove(b"Info");
    } else {
        let info_id = match document.trailer.get(b"Info") {
            Ok(Object::Reference(id)) => *id,
            _ => document.add_object(Dictionary::new()),
        };
        let object = document.get_object_mut(info_id).map_err(|error| error.to_string())?;
        let dictionary = object.as_dict_mut().map_err(|error| error.to_string())?;
        set_info_value(dictionary, "Title", &update.title);
        set_info_value(dictionary, "Author", &update.author);
        set_info_value(dictionary, "Subject", &update.subject);
        set_info_value(dictionary, "Keywords", &update.keywords);
        set_info_value(dictionary, "Creator", &update.creator);
        set_info_value(dictionary, "Producer", &update.producer);
        document.trailer.set("Info", Object::Reference(info_id));
    }
    save_document(document, Path::new(&output_path), false)
}

#[tauri::command]
pub fn protect_pdf(path: String, output_path: String, open_password: String, owner_password: String) -> Result<String, String> {
    if open_password.is_empty() {
        return Err("An open password is required".into());
    }
    let mut document = Document::load(&path).map_err(|error| error.to_string())?;
    if document.was_encrypted() {
        return Err("The source PDF is already encrypted".into());
    }
    let owner = if owner_password.is_empty() { open_password.clone() } else { owner_password };
    let version = EncryptionVersion::V2 {
        document: &document,
        owner_password: &owner,
        user_password: &open_password,
        key_length: 128,
        permissions: Permissions::all(),
    };
    let state = EncryptionState::try_from(version).map_err(|error| error.to_string())?;
    document.encrypt(&state).map_err(|error| error.to_string())?;
    save_document(document, Path::new(&output_path), false)
}

#[tauri::command]
pub fn unlock_pdf(path: String, output_path: String, password: String) -> Result<String, String> {
    if password.is_empty() {
        return Err("The current password is required".into());
    }
    let mut document = Document::load(&path).map_err(|error| error.to_string())?;
    if !document.was_encrypted() {
        return Err("The source PDF is not encrypted".into());
    }
    document.decrypt(&password).map_err(|error| error.to_string())?;
    document.trailer.remove(b"Encrypt");
    document.encryption_state = None;
    save_document(document, Path::new(&output_path), false)
}


