import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { supabase } from "../../src/services/supabase";

const STORAGE_BUCKET = "documents";

const MICROSOFT_APPS = {
  word: {
    key: "word",
    name: "Microsoft Word",
    shortName: "Word",
    description: "Create and edit documents",
    url: "https://www.office.com/launch/word",
    icon: "document-text-outline",
  },

  excel: {
    key: "excel",
    name: "Microsoft Excel",
    shortName: "Excel",
    description: "Create and edit spreadsheets",
    url: "https://www.office.com/launch/excel",
    icon: "grid-outline",
  },

  powerpoint: {
    key: "powerpoint",
    name: "Microsoft PowerPoint",
    shortName: "PowerPoint",
    description: "Create and edit presentations",
    url: "https://www.office.com/launch/powerpoint",
    icon: "easel-outline",
  },
};

/* -------------------------------------------------------
   FILE HELPERS
------------------------------------------------------- */

const getFileExtension = (fileName = "") => {
  const cleanName = String(fileName).split("?")[0];
  const parts = cleanName.toLowerCase().split(".");

  return parts.length > 1 ? parts.pop() : "";
};

const getMicrosoftAppForFile = (fileName = "") => {
  const extension = getFileExtension(fileName);

  if (["doc", "docx", "odt", "rtf"].includes(extension)) {
    return MICROSOFT_APPS.word;
  }

  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return MICROSOFT_APPS.excel;
  }

  if (["ppt", "pptx", "odp"].includes(extension)) {
    return MICROSOFT_APPS.powerpoint;
  }

  return null;
};

const getFileTypeLabel = (fileName = "") => {
  const extension = getFileExtension(fileName);

  if (["doc", "docx", "odt", "rtf"].includes(extension)) {
    return "WORD";
  }

  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return "EXCEL";
  }

  if (["ppt", "pptx", "odp"].includes(extension)) {
    return "POWERPOINT";
  }

  if (extension === "pdf") {
    return "PDF";
  }

  return extension ? extension.toUpperCase() : "FILE";
};

const getFileIcon = (fileName = "") => {
  const extension = getFileExtension(fileName);

  if (["doc", "docx", "odt", "rtf"].includes(extension)) {
    return "document-text-outline";
  }

  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return "grid-outline";
  }

  if (["ppt", "pptx", "odp"].includes(extension)) {
    return "easel-outline";
  }

  if (extension === "pdf") {
    return "document-outline";
  }

  return "document-attach-outline";
};

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const formatShortDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const sanitizeFileName = (name = "document") => {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_");
};

/* -------------------------------------------------------
   WORKSPACE
------------------------------------------------------- */

export default function Workspace() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const organisationId = Array.isArray(params.organisationId)
    ? params.organisationId[0]
    : params.organisationId;

  const [user, setUser] = useState(null);
  const [organisation, setOrganisation] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [versions, setVersions] = useState([]);

  const [fundingAgreements, setFundingAgreements] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newDocumentModal, setNewDocumentModal] = useState(false);
  const [versionModal, setVersionModal] = useState(false);
  const [versionsModal, setVersionsModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);

  const [changeSummary, setChangeSummary] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const [notice, setNotice] = useState(null);

  const [searchText, setSearchText] = useState("");

  /* -------------------------------------------------------
     INITIALISE
  ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function initializeWorkspace() {
      if (!organisationId) {
        if (mounted) {
          setLoading(false);
          showNotice(
            "error",
            "Organisation not selected",
            "No organisation was supplied to this workspace."
          );
        }

        return;
      }

      if (mounted) {
        setLoading(true);
      }

      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        await Promise.all([
          loadOrganisation(currentUser),
          loadDocuments(currentUser),
          loadFundingAgreements(),
          loadNotifications(),
        ]);
      } catch (error) {
        console.error("Workspace initialization error:", error);

        if (mounted) {
          showNotice(
            "error",
            "Workspace error",
            error?.message || "Unable to load the workspace."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeWorkspace();

    return () => {
      mounted = false;
    };
  }, [organisationId]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 7000);

    return () => clearTimeout(timer);
  }, [notice]);

  /* -------------------------------------------------------
     ORGANISATION
  ------------------------------------------------------- */

  async function loadOrganisation(currentUser) {
    try {
      let query = supabase.from("organisations").select("*");

      if (organisationId) {
        query = query.eq("id", organisationId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error("Organisation error:", error);
        return;
      }

      setOrganisation(data);
    } catch (error) {
      console.error("Organisation loading error:", error);
    }
  }

  /* -------------------------------------------------------
     DOCUMENTS
     
     IMPORTANT:
     Current documents table contains:
       id
       title
       description
       current_version
       created_by
       created_at
       status

     There is currently NO organisation_id on documents.
     Therefore documents are loaded by created_by.
  ------------------------------------------------------- */

  async function loadDocuments(currentUser) {
    if (!currentUser?.id) return;

    setDocumentsLoading(true);

    try {
      const {
        data: documentData,
        error: documentError,
      } = await supabase
        .from("documents")
        .select("*")
        .eq("created_by", currentUser.id)
        .order("created_at", { ascending: false });

      if (documentError) {
        throw documentError;
      }

      const docs = documentData || [];

      if (docs.length === 0) {
        setDocuments([]);
        setVersions([]);
        return;
      }

      const documentIds = docs.map((doc) => doc.id);

      const {
        data: versionData,
        error: versionError,
      } = await supabase
        .from("document_versions")
        .select("*")
        .in("document_id", documentIds)
        .order("version_number", { ascending: false });

      if (versionError) {
        throw versionError;
      }

      const allVersions = versionData || [];

      const latestVersionMap = {};

      allVersions.forEach((version) => {
        if (!latestVersionMap[version.document_id]) {
          latestVersionMap[version.document_id] = version;
        }
      });

      const enrichedDocuments = docs.map((doc) => ({
        ...doc,
        latest_version: latestVersionMap[doc.id] || null,
      }));

      setDocuments(enrichedDocuments);
      setVersions(allVersions);
    } catch (error) {
      console.error("Documents error:", error);

      showNotice(
        "error",
        "Documents could not be loaded",
        error?.message || "Please try again."
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  /* -------------------------------------------------------
     FUNDING AGREEMENTS
  ------------------------------------------------------- */

  async function loadFundingAgreements() {
    if (!organisationId) {
      setFundingAgreements([]);
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("funding_agreements")
        .select("*")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Funding agreements error:", error);
        setFundingAgreements([]);
        return;
      }

      setFundingAgreements(data || []);
    } catch (error) {
      console.error("Funding loading error:", error);
      setFundingAgreements([]);
    }
  }

  /* -------------------------------------------------------
     NOTIFICATIONS
  ------------------------------------------------------- */

  async function loadNotifications() {
    if (!organisationId) {
      setNotifications([]);
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("notifications")
        .select("*")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Notifications error:", error);
        setNotifications([]);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Notification loading error:", error);
      setNotifications([]);
    }
  }

  /* -------------------------------------------------------
     NOTICE
  ------------------------------------------------------- */

  function showNotice(type, title, message) {
    setNotice({
      type,
      title,
      message,
    });
  }

  /* -------------------------------------------------------
     MICROSOFT APPLICATIONS
     
     IMPORTANT:
     We do NOT use Entra ID, Graph, OneDrive or SharePoint.
     
     CIVITRACK opens the normal Microsoft application.
     The user returns to CIVITRACK and uploads the saved
     document as a new version.
  ------------------------------------------------------- */

  function openMicrosoftApp(app) {
    if (!app?.url) {
      showNotice(
        "error",
        "Microsoft application unavailable",
        "The Microsoft application link is not configured."
      );

      return false;
    }

    try {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        typeof window.open === "function"
      ) {
        /*
         * IMPORTANT:
         * This happens directly from the button click.
         * Do not place an await before window.open().
         */
        const newWindow = window.open(app.url, "_blank");

        if (!newWindow) {
          showNotice(
            "warning",
            "Popup blocked",
            `Your browser blocked ${app.name}. Please allow pop-ups for CIVITRACK and try again.`
          );

          return false;
        }

        try {
          newWindow.opener = null;
        } catch {}

        return true;
      }

      Linking.openURL(app.url);

      return true;
    } catch (error) {
      console.error("Microsoft opening error:", error);

      showNotice(
        "error",
        "Could not open Microsoft",
        `CIVITRACK could not open ${app.name}.`
      );

      return false;
    }
  }

  /* -------------------------------------------------------
     AUDIT LOGGING
  ------------------------------------------------------- */

  async function recordAudit(
    action,
    description,
    documentId = null
  ) {
    try {
      if (!user?.id) return;

      const { error } = await supabase.from("audit_logs").insert({
        action,
        user_id: user.id,
        organisation_id: organisationId || null,
        document_id: documentId,
        description,
      });

      if (error) {
        console.log("Audit log skipped:", error.message);
      }
    } catch (error) {
      console.log("Audit log skipped:", error?.message);
    }
  }

  /* -------------------------------------------------------
     CREATE DOCUMENT WITH MICROSOFT
  ------------------------------------------------------- */

  function handleCreateWithMicrosoft(app) {
    /*
     * Close modal first.
     */
    setNewDocumentModal(false);

    /*
     * Open immediately.
     */
    const opened = openMicrosoftApp(app);

    if (!opened) return;

    showNotice(
      "info",
      `${app.name} opened`,
      `Create your file in ${app.name}. When you finish, return to CIVITRACK and use "+ New" → "Upload Existing" to save the document here.`
    );

    recordAudit(
      "MICROSOFT_APP_OPENED",
      `Opened ${app.name} from the CIVITRACK workspace.`
    );
  }

  /* -------------------------------------------------------
     EDIT EXISTING DOCUMENT IN MICROSOFT
  ------------------------------------------------------- */

  function handleEditExistingDocument(document) {
    const fileName =
      document?.latest_version?.file_path ||
      document?.title ||
      "";

    const app = getMicrosoftAppForFile(fileName);

    if (!app) {
      showNotice(
        "warning",
        "Microsoft application not detected",
        "This file type is not mapped to Word, Excel or PowerPoint."
      );

      return;
    }

    /*
     * Open directly from the user's click.
     */
    const opened = openMicrosoftApp(app);

    if (!opened) return;

    showNotice(
      "info",
      `${app.name} opened`,
      `Edit "${document.title}" in ${app.shortName}. When finished, return to CIVITRACK and choose "+ Version" to upload the edited file.`
    );

    recordAudit(
      "MICROSOFT_EDIT_OPENED",
      `Opened ${document.title} in ${app.name} for editing.`,
      document.id
    );
  }

  /* -------------------------------------------------------
     PICK EXISTING DOCUMENT
  ------------------------------------------------------- */

  async function pickAndUploadNewDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];

      if (!file) {
        showNotice(
          "error",
          "No file selected",
          "Please choose a file and try again."
        );

        return;
      }

      await uploadNewDocument(file);
    } catch (error) {
      console.error("Document picker error:", error);

      showNotice(
        "error",
        "File selection failed",
        error?.message || "Could not select the file."
      );
    }
  }

  /* -------------------------------------------------------
     UPLOAD NEW DOCUMENT
  ------------------------------------------------------- */

  async function uploadNewDocument(file) {
    if (!user?.id) {
      showNotice(
        "error",
        "Authentication required",
        "Please sign in again before uploading a document."
      );

      return;
    }

    setUploading(true);

    let uploadedPath = null;
    let createdDocumentId = null;

    try {
      const originalName =
        file.name ||
        `document-${Date.now()}`;

      const safeName = sanitizeFileName(originalName);

      /*
       * Storage path:
       *
       * userId/timestamp-filename
       */
      uploadedPath = `${user.id}/${Date.now()}-${safeName}`;

      const response = await fetch(file.uri);

      if (!response.ok) {
        throw new Error(
          `Could not read the selected file. HTTP ${response.status}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      const {
        error: uploadError,
      } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uploadedPath, arrayBuffer, {
          contentType:
            file.mimeType ||
            "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      /*
       * Create document record.
       */
      const {
        data: documentData,
        error: documentError,
      } = await supabase
        .from("documents")
        .insert({
          title: originalName,
          description: "Uploaded to CIVITRACK",
          current_version: 1,
          created_by: user.id,
          status: "active",
        })
        .select()
        .single();

      if (documentError) {
        throw documentError;
      }

      createdDocumentId = documentData.id;

      /*
       * Create first version.
       */
      const {
        error: versionError,
      } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentData.id,
          version_number: 1,
          file_path: uploadedPath,
          edited_by: user.id,
          change_summary: "Initial document upload",
        });

      if (versionError) {
        throw versionError;
      }

      setNewDocumentModal(false);

      await recordAudit(
        "DOCUMENT_CREATED",
        `Created document ${originalName} with version 1.`,
        documentData.id
      );

      await loadDocuments(user);

      showNotice(
        "success",
        "Document added",
        `${originalName} has been saved to the CIVITRACK workspace.`
      );
    } catch (error) {
      console.error("Upload document error:", error);

      /*
       * Clean up storage if something failed.
       */
      if (uploadedPath) {
        try {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([uploadedPath]);
        } catch (cleanupError) {
          console.log(
            "Storage cleanup skipped:",
            cleanupError?.message
          );
        }
      }

      /*
       * If the document row was created but the version
       * failed, remove the document record as well.
       */
      if (createdDocumentId) {
        try {
          await supabase
            .from("documents")
            .delete()
            .eq("id", createdDocumentId);
        } catch (cleanupError) {
          console.log(
            "Document cleanup skipped:",
            cleanupError?.message
          );
        }
      }

      showNotice(
        "error",
        "Upload failed",
        error?.message ||
          "The document could not be uploaded."
      );
    } finally {
      setUploading(false);
    }
  }

  /* -------------------------------------------------------
     VERSION MODAL
  ------------------------------------------------------- */

  function openVersionModal(document) {
    setSelectedDocument(document);
    setChangeSummary("");
    setVersionModal(true);
  }

  /* -------------------------------------------------------
     PICK NEW VERSION
  ------------------------------------------------------- */

  async function uploadNewVersion() {
    if (!selectedDocument || !user?.id) {
      showNotice(
        "error",
        "Unable to continue",
        "Please select a document and make sure you are signed in."
      );

      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];

      if (!file) {
        showNotice(
          "error",
          "No file selected",
          "Please choose the edited file."
        );

        return;
      }

      await saveNewVersion(file);
    } catch (error) {
      console.error("Version picker error:", error);

      showNotice(
        "error",
        "Version upload failed",
        error?.message ||
          "Could not select the edited file."
      );
    }
  }

  /* -------------------------------------------------------
     SAVE NEW VERSION
  ------------------------------------------------------- */

  async function saveNewVersion(file) {
    if (!selectedDocument || !user?.id) return;

    setUploading(true);

    let uploadedPath = null;
    const documentId = selectedDocument.id;
    const documentTitle = selectedDocument.title;

    try {
      const originalName =
        file.name ||
        `version-${Date.now()}`;

      const safeName = sanitizeFileName(originalName);

      const nextVersion =
        Number(
          selectedDocument.current_version || 0
        ) + 1;

      uploadedPath =
        `${user.id}/${documentId}/v${nextVersion}-${Date.now()}-${safeName}`;

      const response = await fetch(file.uri);

      if (!response.ok) {
        throw new Error(
          `Could not read the selected file. HTTP ${response.status}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      /*
       * Upload file.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(uploadedPath, arrayBuffer, {
          contentType:
            file.mimeType ||
            "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const summary =
        changeSummary.trim() ||
        `Uploaded version ${nextVersion}`;

      /*
       * Insert version.
       */
      const {
        error: versionError,
      } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          file_path: uploadedPath,
          edited_by: user.id,
          change_summary: summary,
        });

      if (versionError) {
        throw versionError;
      }

      /*
       * IMPORTANT FIX:
       *
       * It was previously:
       * .from("ocuments")
       *
       * It must be:
       * .from("documents")
       */
      const {
        error: updateError,
      } = await supabase
        .from("documents")
        .update({
          current_version: nextVersion,
        })
        .eq("id", documentId);

      if (updateError) {
        throw updateError;
      }

      await recordAudit(
        "DOCUMENT_VERSION_CREATED",
        `Uploaded version ${nextVersion} of ${documentTitle}. ${summary}`,
        documentId
      );

      setVersionModal(false);
      setSelectedDocument(null);
      setChangeSummary("");

      await loadDocuments(user);

      showNotice(
        "success",
        "New version saved",
        `${documentTitle} is now on version ${nextVersion}.`
      );
    } catch (error) {
      console.error("Save version error:", error);

      /*
       * IMPORTANT FIX:
       *
       * Storage bucket is lowercase:
       * documents
       */
      if (uploadedPath) {
        try {
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([uploadedPath]);
        } catch (cleanupError) {
          console.log(
            "Version storage cleanup skipped:",
            cleanupError?.message
          );
        }
      }

      showNotice(
        "error",
        "Could not save version",
        error?.message ||
          "The new version could not be saved."
      );
    } finally {
      setUploading(false);
    }
  }

  /* -------------------------------------------------------
     OPEN STORED DOCUMENT
  ------------------------------------------------------- */

  async function openStoredDocument(document) {
    const latestVersion = document?.latest_version;

    if (!latestVersion?.file_path) {
      showNotice(
        "warning",
        "File unavailable",
        "There is no uploaded file associated with this document."
      );

      return;
    }

    let popup = null;

    /*
     * Open blank window immediately on web.
     * This prevents popup blocking while Supabase
     * creates the signed URL.
     */
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined"
    ) {
      popup = window.open("", "_blank");

      if (!popup) {
        showNotice(
          "warning",
          "Popup blocked",
          "Please allow pop-ups for CIVITRACK and try again."
        );

        return;
      }

      try {
        popup.document.write(
          "<p style='font-family:Arial;padding:30px'>Opening document...</p>"
        );
      } catch {}
    }

    try {
      const {
        data,
        error,
      } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(
          latestVersion.file_path,
          3600
        );

      if (error) {
        console.error(
          "SUPABASE STORAGE SIGNED URL ERROR:",
          error
        );

        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Supabase did not return a secure document URL."
        );
      }

      if (popup) {
        popup.location.href = data.signedUrl;
      } else {
        await Linking.openURL(data.signedUrl);
      }

      await recordAudit(
        "DOCUMENT_OPENED",
        `Opened ${document.title}, version ${document.current_version}.`,
        document.id
      );
    } catch (error) {
      console.error("Open document error:", error);

      if (popup) {
        try {
          popup.close();
        } catch {}
      }

      showNotice(
        "error",
        "Could not open document",
        error?.message ||
          "Unable to open the stored document."
      );
    }
  }

  /* -------------------------------------------------------
     VERSION HISTORY
  ------------------------------------------------------- */

  function openVersions(document) {
    setSelectedDocument(document);
    setVersionsModal(true);
  }

  function getDocumentVersions(documentId) {
    return versions
      .filter(
        (version) =>
          version.document_id === documentId
      )
      .sort(
        (a, b) =>
          b.version_number -
          a.version_number
      );
  }

  /* -------------------------------------------------------
     FILTER DOCUMENTS
  ------------------------------------------------------- */

  const filteredDocuments = useMemo(() => {
    const query = searchText
      .trim()
      .toLowerCase();

    if (!query) return documents;

    return documents.filter((document) => {
      const title =
        document.title?.toLowerCase() || "";

      const description =
        document.description?.toLowerCase() || "";

      return (
        title.includes(query) ||
        description.includes(query)
      );
    });
  }, [documents, searchText]);

  /* -------------------------------------------------------
     STATS
  ------------------------------------------------------- */

  const unreadNotifications =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  const activeAgreements =
    fundingAgreements.filter((agreement) => {
      const status = String(
        agreement.status || ""
      ).toLowerCase();

      return (
        status === "active" ||
        status === "approved" ||
        status === "in progress"
      );
    }).length;

  /* -------------------------------------------------------
     LOADING SCREEN
  ------------------------------------------------------- */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingLogo}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#2563EB"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#2563EB"
            style={{ marginTop: 18 }}
          />

          <Text style={styles.loadingTitle}>
            Loading CIVITRACK
          </Text>

          <Text style={styles.loadingSubtitle}>
            Preparing your organisation workspace...
          </Text>
        </View>
      </View>
    );
  }

  /* -------------------------------------------------------
     MAIN UI
  ------------------------------------------------------- */

  return (
    <View style={styles.container}>

      {/* SIDEBAR */}

      <View style={styles.sidebar}>
        <View>
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Ionicons
                name="shield-checkmark"
                size={23}
                color="#FFFFFF"
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                CIVITRACK
              </Text>

              <Text style={styles.brandSubtitle}>
                PUBLIC ENTITY PORTAL
              </Text>
            </View>
          </View>

          <View style={styles.sidebarDivider} />

          <Text style={styles.sidebarLabel}>
            WORKSPACE
          </Text>

          <SidebarButton
            icon="grid-outline"
            label="Overview"
            active={
              activeSection === "overview"
            }
            onPress={() =>
              setActiveSection("overview")
            }
          />

          <SidebarButton
            icon="documents-outline"
            label="Documents"
            active={
              activeSection === "documents"
            }
            onPress={() =>
              setActiveSection("documents")
            }
            badge={documents.length}
          />

          <SidebarButton
            icon="wallet-outline"
            label="Funding Agreements"
            active={
              activeSection === "funding"
            }
            onPress={() =>
              setActiveSection("funding")
            }
            badge={fundingAgreements.length}
          />

          <SidebarButton
            icon="notifications-outline"
            label="Notifications"
            active={
              activeSection === "notifications"
            }
            onPress={() =>
              setActiveSection("notifications")
            }
            badge={unreadNotifications}
          />
        </View>

        <View>
          <View style={styles.sidebarHelp}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#93C5FD"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.sidebarHelpTitle}>
                CIVITRACK Workspace
              </Text>

              <Text style={styles.sidebarHelpText}>
                Centralise reporting, funding and
                document records.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              color="#CBD5E1"
            />

            <Text style={styles.backButtonText}>
              Back to dashboard
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MAIN */}

      <View style={styles.main}>

        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>
              {organisation?.name ||
                "Organisation Workspace"}
            </Text>

            <View style={styles.headerMetaRow}>
              <View style={styles.entityPill}>
                <View style={styles.entityDot} />

                <Text
                  style={styles.entityPillText}
                >
                  {organisation?.type ||
                    organisation?.organisation_type ||
                    "ORGANISATION"}
                </Text>
              </View>

              <Text style={styles.headerDate}>
                Secure workspace
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.headerNotification}
              onPress={() =>
                setActiveSection(
                  "notifications"
                )
              }
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color="#334155"
              />

              {unreadNotifications > 0 && (
                <View
                  style={styles.notificationBadge}
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(user?.email?.[0] || "U").toUpperCase()}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.email?.split("@")[0] ||
                  "User"}
              </Text>

              <Text style={styles.userEmail}>
                {user?.email || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* CONTENT */}

        <ScrollView
          style={styles.content}
          contentContainerStyle={
            styles.contentContainer
          }
          showsVerticalScrollIndicator={false}
        >

          {/* NOTICE */}

          {notice && (
            <View
              style={[
                styles.notice,
                notice.type === "success" &&
                  styles.noticeSuccess,
                notice.type === "error" &&
                  styles.noticeError,
                notice.type === "warning" &&
                  styles.noticeWarning,
                notice.type === "info" &&
                  styles.noticeInfo,
              ]}
            >
              <View style={styles.noticeIcon}>
                <Ionicons
                  name={
                    notice.type === "success"
                      ? "checkmark-circle"
                      : notice.type === "error"
                      ? "close-circle"
                      : notice.type === "warning"
                      ? "warning"
                      : "information-circle"
                  }
                  size={21}
                  color={
                    notice.type === "success"
                      ? "#15803D"
                      : notice.type === "error"
                      ? "#B91C1C"
                      : notice.type === "warning"
                      ? "#A16207"
                      : "#1D4ED8"
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>
                  {notice.title}
                </Text>

                <Text style={styles.noticeMessage}>
                  {notice.message}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setNotice(null)
                }
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </View>
          )}

          {/* OVERVIEW */}

          {activeSection === "overview" && (
            <>
              <View style={styles.welcomeRow}>
                <View>
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    ORGANISATION WORKSPACE
                  </Text>

                  <Text
                    style={styles.welcomeTitle}
                  >
                    Good day,{" "}
                    {user?.email?.split("@")[0] ||
                      "User"}
                  </Text>

                  <Text
                    style={
                      styles.welcomeDescription
                    }
                  >
                    Manage your organisation's
                    documents, funding agreements
                    and reporting activity from one
                    place.
                  </Text>
                </View>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() =>
                    setNewDocumentModal(true)
                  }
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    New Document
                  </Text>
                </Pressable>
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  icon="documents-outline"
                  label="Documents"
                  value={documents.length}
                  description="Tracked documents"
                />

                <StatCard
                  icon="git-branch-outline"
                  label="Versions"
                  value={versions.length}
                  description="Version records"
                />

                <StatCard
                  icon="wallet-outline"
                  label="Funding"
                  value={activeAgreements}
                  description="Active agreements"
                />

                <StatCard
                  icon="notifications-outline"
                  label="Notifications"
                  value={
                    unreadNotifications
                  }
                  description="Unread notifications"
                />
              </View>

              <View
                style={styles.sectionHeader}
              >
                <View>
                  <Text
                    style={styles.sectionTitle}
                  >
                    Document Centre
                  </Text>

                  <Text
                    style={styles.sectionSubtitle}
                  >
                    Access and manage your tracked
                    documents.
                  </Text>
                </View>

                <Pressable
                  style={
                    styles.secondaryButton
                  }
                  onPress={() =>
                    setActiveSection(
                      "documents"
                    )
                  }
                >
                  <Text
                    style={
                      styles.secondaryButtonText
                    }
                  >
                    View all
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#2563EB"
                  />
                </Pressable>
              </View>

              <DocumentPanel
                documents={documents.slice(0, 5)}
                loading={documentsLoading}
                onNew={() =>
                  setNewDocumentModal(true)
                }
                onOpen={openStoredDocument}
                onEdit={
                  handleEditExistingDocument
                }
                onVersion={openVersionModal}
                onVersions={openVersions}
              />

              <View style={styles.twoColumn}>
                <View style={styles.infoPanel}>
                  <View
                    style={styles.panelHeader}
                  >
                    <View>
                      <Text
                        style={styles.panelTitle}
                      >
                        Funding Agreements
                      </Text>

                      <Text
                        style={
                          styles.panelSubtitle
                        }
                      >
                        Latest funding activity
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        setActiveSection(
                          "funding"
                        )
                      }
                    >
                      <Text
                        style={styles.linkText}
                      >
                        View all
                      </Text>
                    </Pressable>
                  </View>

                  {fundingAgreements.length ===
                  0 ? (
                    <EmptyMini
                      icon="wallet-outline"
                      text="No funding agreements found."
                    />
                  ) : (
                    fundingAgreements
                      .slice(0, 4)
                      .map((agreement) => (
                        <FundingRow
                          key={agreement.id}
                          agreement={agreement}
                        />
                      ))
                  )}
                </View>

                <View style={styles.infoPanel}>
                  <View
                    style={styles.panelHeader}
                  >
                    <View>
                      <Text
                        style={styles.panelTitle}
                      >
                        Recent Notifications
                      </Text>

                      <Text
                        style={
                          styles.panelSubtitle
                        }
                      >
                        Workspace alerts
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        setActiveSection(
                          "notifications"
                        )
                      }
                    >
                      <Text
                        style={styles.linkText}
                      >
                        View all
                      </Text>
                    </Pressable>
                  </View>

                  {notifications.length ===
                  0 ? (
                    <EmptyMini
                      icon="notifications-outline"
                      text="No notifications."
                    />
                  ) : (
                    notifications
                      .slice(0, 4)
                      .map((notification) => (
                        <NotificationRow
                          key={notification.id}
                          notification={
                            notification
                          }
                        />
                      ))
                  )}
                </View>
              </View>
            </>
          )}

          {/* DOCUMENTS */}

          {activeSection === "documents" && (
            <>
              <View
                style={
                  styles.pageSectionHeader
                }
              >
                <View>
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    DOCUMENT MANAGEMENT
                  </Text>

                  <Text
                    style={styles.pageSectionTitle}
                  >
                    Documents
                  </Text>

                  <Text
                    style={
                      styles.pageSectionDescription
                    }
                  >
                    Create, upload, edit and version
                    your organisation documents.
                  </Text>
                </View>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() =>
                    setNewDocumentModal(true)
                  }
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    New Document
                  </Text>
                </Pressable>
              </View>

              <View
                style={styles.searchContainer}
              >
                <Ionicons
                  name="search-outline"
                  size={19}
                  color="#64748B"
                />

                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search documents..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
              </View>

              <DocumentPanel
                documents={filteredDocuments}
                loading={documentsLoading}
                onNew={() =>
                  setNewDocumentModal(true)
                }
                onOpen={openStoredDocument}
                onEdit={
                  handleEditExistingDocument
                }
                onVersion={openVersionModal}
                onVersions={openVersions}
              />
            </>
          )}

          {/* FUNDING */}

          {activeSection === "funding" && (
            <>
              <View
                style={
                  styles.pageSectionHeader
                }
              >
                <View>
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    FINANCIAL OVERSIGHT
                  </Text>

                  <Text
                    style={styles.pageSectionTitle}
                  >
                    Funding Agreements
                  </Text>

                  <Text
                    style={
                      styles.pageSectionDescription
                    }
                  >
                    Review agreements linked to this
                    organisation.
                  </Text>
                </View>
              </View>

              <View style={styles.infoPanel}>
                {fundingAgreements.length ===
                0 ? (
                  <EmptyState
                    icon="wallet-outline"
                    title="No funding agreements"
                    description="There are currently no funding agreements available for this organisation."
                  />
                ) : (
                  fundingAgreements.map(
                    (agreement) => (
                      <FundingRow
                        key={agreement.id}
                        agreement={agreement}
                        large
                      />
                    )
                  )
                )}
              </View>
            </>
          )}

          {/* NOTIFICATIONS */}

          {activeSection ===
            "notifications" && (
            <>
              <View
                style={
                  styles.pageSectionHeader
                }
              >
                <View>
                  <Text
                    style={styles.sectionEyebrow}
                  >
                    ACTIVITY CENTRE
                  </Text>

                  <Text
                    style={styles.pageSectionTitle}
                  >
                    Notifications
                  </Text>

                  <Text
                    style={
                      styles.pageSectionDescription
                    }
                  >
                    Important workspace updates and
                    alerts.
                  </Text>
                </View>
              </View>

              <View style={styles.infoPanel}>
                {notifications.length ===
                0 ? (
                  <EmptyState
                    icon="notifications-outline"
                    title="No notifications"
                    description="There are no notifications for this organisation."
                  />
                ) : (
                  notifications.map(
                    (notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={
                          notification
                        }
                        large
                      />
                    )
                  )
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* -------------------------------------------------------
          NEW DOCUMENT MODAL
      ------------------------------------------------------- */}

      <Modal
        visible={newDocumentModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNewDocumentModal(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  New Document
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  Choose how you want to start your
                  document.
                </Text>
              </View>

              <Pressable
                style={styles.modalClose}
                onPress={() =>
                  setNewDocumentModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={21}
                  color="#475569"
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalContent
              }
            >
              <Text
                style={styles.modalSectionLabel}
              >
                MICROSOFT APPLICATIONS
              </Text>

              <Text
                style={styles.modalExplanation}
              >
                Open the normal Microsoft web
                application. Create or edit the file
                there, then return to CIVITRACK and
                upload the saved file.
              </Text>

              <MicrosoftAppCard
                app={MICROSOFT_APPS.word}
                onPress={() =>
                  handleCreateWithMicrosoft(
                    MICROSOFT_APPS.word
                  )
                }
              />

              <MicrosoftAppCard
                app={MICROSOFT_APPS.excel}
                onPress={() =>
                  handleCreateWithMicrosoft(
                    MICROSOFT_APPS.excel
                  )
                }
              />

              <MicrosoftAppCard
                app={
                  MICROSOFT_APPS.powerpoint
                }
                onPress={() =>
                  handleCreateWithMicrosoft(
                    MICROSOFT_APPS.powerpoint
                  )
                }
              />

              <View
                style={styles.modalDivider}
              >
                <View
                  style={styles.dividerLine}
                />

                <Text
                  style={styles.dividerText}
                >
                  OR
                </Text>

                <View
                  style={styles.dividerLine}
                />
              </View>

              <Pressable
                style={
                  styles.uploadExistingButton
                }
                onPress={
                  pickAndUploadNewDocument
                }
                disabled={uploading}
              >
                <View
                  style={
                    styles.uploadExistingIcon
                  }
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.uploadExistingTitle
                    }
                  >
                    Upload Existing File
                  </Text>

                  <Text
                    style={
                      styles.uploadExistingDescription
                    }
                  >
                    Add a Word, Excel, PowerPoint,
                    PDF or other file directly to
                    CIVITRACK.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#94A3B8"
                />
              </Pressable>

              {uploading && (
                <View
                  style={styles.uploadingRow}
                >
                  <ActivityIndicator
                    size="small"
                    color="#2563EB"
                  />

                  <Text
                    style={
                      styles.uploadingText
                    }
                  >
                    Uploading document...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------
          NEW VERSION MODAL
      ------------------------------------------------------- */}

      <Modal
        visible={versionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!uploading) {
            setVersionModal(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Save New Version
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  Upload the edited file to create
                  the next version.
                </Text>
              </View>

              <Pressable
                style={styles.modalClose}
                onPress={() => {
                  if (!uploading) {
                    setVersionModal(false);
                  }
                }}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color="#475569"
                />
              </Pressable>
            </View>

            <View
              style={
                styles.versionDocumentCard
              }
            >
              <View
                style={styles.fileIconLarge}
              >
                <Ionicons
                  name={getFileIcon(
                    selectedDocument
                      ?.latest_version
                      ?.file_path ||
                      selectedDocument?.title
                  )}
                  size={25}
                  color="#2563EB"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.versionDocumentTitle
                  }
                  numberOfLines={2}
                >
                  {selectedDocument?.title ||
                    "Document"}
                </Text>

                <Text
                  style={
                    styles.versionDocumentMeta
                  }
                >
                  Current version:{" "}
                  {selectedDocument?.current_version ||
                    1}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>
              CHANGE SUMMARY
            </Text>

            <TextInput
              value={changeSummary}
              onChangeText={setChangeSummary}
              placeholder="Example: Updated quarterly targets and financial figures"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />

            <Pressable
              style={[
                styles.saveVersionButton,
                uploading &&
                  styles.buttonDisabled,
              ]}
              onPress={uploadNewVersion}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.saveVersionButtonText
                    }
                  >
                    Upload New Version
                  </Text>
                </>
              )}
            </Pressable>

            <Text
              style={styles.versionHelpText}
            >
              Version history is retained in
              CIVITRACK. The new file becomes the
              current version after a successful
              upload.
            </Text>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------------
          VERSION HISTORY MODAL
      ------------------------------------------------------- */}

      <Modal
        visible={versionsModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setVersionsModal(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={styles.modalCardLarge}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Version History
                </Text>

                <Text
                  style={styles.modalSubtitle}
                  numberOfLines={1}
                >
                  {selectedDocument?.title ||
                    "Document"}
                </Text>
              </View>

              <Pressable
                style={styles.modalClose}
                onPress={() =>
                  setVersionsModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={21}
                  color="#475569"
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={{
                paddingBottom: 12,
              }}
            >
              {selectedDocument &&
              getDocumentVersions(
                selectedDocument.id
              ).length > 0 ? (
                getDocumentVersions(
                  selectedDocument.id
                ).map((version) => (
                  <View
                    key={version.id}
                    style={styles.versionRow}
                  >
                    <View
                      style={[
                        styles.versionNumber,
                        version.version_number ===
                          selectedDocument.current_version &&
                          styles.versionNumberCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.versionNumberText,
                          version.version_number ===
                            selectedDocument.current_version &&
                            styles.versionNumberTextCurrent,
                        ]}
                      >
                        v{version.version_number}
                      </Text>
                    </View>

                    <View
                      style={{ flex: 1 }}
                    >
                      <View
                        style={
                          styles.versionRowTop
                        }
                      >
                        <Text
                          style={
                            styles.versionRowTitle
                          }
                        >
                          Version{" "}
                          {version.version_number}
                        </Text>

                        {version.version_number ===
                          selectedDocument.current_version && (
                          <View
                            style={
                              styles.currentPill
                            }
                          >
                            <Text
                              style={
                                styles.currentPillText
                              }
                            >
                              CURRENT
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={
                          styles.versionSummary
                        }
                      >
                        {version.change_summary ||
                          "No change summary provided."}
                      </Text>

                      <Text
                        style={
                          styles.versionDate
                        }
                      >
                        Updated{" "}
                        {formatDate(
                          version.edited_at
                        )}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="git-branch-outline"
                  title="No version history"
                  description="No version records are available for this document."
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------
   COMPONENTS
------------------------------------------------------- */

function SidebarButton({
  icon,
  label,
  active,
  onPress,
  badge,
}) {
  return (
    <Pressable
      style={[
        styles.sidebarButton,
        active &&
          styles.sidebarButtonActive,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={19}
        color={
          active ? "#FFFFFF" : "#94A3B8"
        }
      />

      <Text
        style={[
          styles.sidebarButtonText,
          active &&
            styles.sidebarButtonTextActive,
        ]}
      >
        {label}
      </Text>

      {badge > 0 && (
        <View
          style={[
            styles.sidebarBadge,
            active &&
              styles.sidebarBadgeActive,
          ]}
        >
          <Text
            style={[
              styles.sidebarBadgeText,
              active &&
                styles.sidebarBadgeTextActive,
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}>
          <Ionicons
            name={icon}
            size={21}
            color="#2563EB"
          />
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={18}
          color="#CBD5E1"
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text
        style={styles.statDescription}
      >
        {description}
      </Text>
    </View>
  );
}

function DocumentPanel({
  documents,
  loading,
  onNew,
  onOpen,
  onEdit,
  onVersion,
  onVersions,
}) {
  return (
    <View style={styles.documentPanel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Documents
          </Text>

          <Text
            style={styles.panelSubtitle}
          >
            Files tracked in your CIVITRACK
            workspace
          </Text>
        </View>

        <Pressable
          style={
            styles.smallPrimaryButton
          }
          onPress={onNew}
        >
          <Ionicons
            name="add"
            size={17}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.smallPrimaryButtonText
            }
          >
            New
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View
          style={styles.loadingDocuments}
        >
          <ActivityIndicator
            size="small"
            color="#2563EB"
          />

          <Text
            style={
              styles.loadingDocumentsText
            }
          >
            Loading documents...
          </Text>
        </View>
      ) : documents.length === 0 ? (
        <EmptyState
          icon="documents-outline"
          title="No documents yet"
          description="Create a Microsoft document or upload an existing file to get started."
          buttonText="Add document"
          onPress={onNew}
        />
      ) : (
        <View>
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              onOpen={onOpen}
              onEdit={onEdit}
              onVersion={onVersion}
              onVersions={onVersions}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function DocumentRow({
  document,
  onOpen,
  onEdit,
  onVersion,
  onVersions,
}) {
  const latestPath =
    document.latest_version
      ?.file_path ||
    document.title ||
    "";

  const type =
    getFileTypeLabel(latestPath);

  const app =
    getMicrosoftAppForFile(
      latestPath
    );

  return (
    <View style={styles.documentRow}>
      <View style={styles.documentMain}>
        <View style={styles.documentIcon}>
          <Ionicons
            name={getFileIcon(
              latestPath
            )}
            size={23}
            color="#2563EB"
          />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={
              styles.documentTitleRow
            }
          >
            <Text
              style={styles.documentTitle}
              numberOfLines={1}
            >
              {document.title}
            </Text>

            <View
              style={styles.fileTypePill}
            >
              <Text
                style={
                  styles.fileTypePillText
                }
              >
                {type}
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.documentDescription
            }
            numberOfLines={1}
          >
            {document.description ||
              "CIVITRACK managed document"}
          </Text>

          <View
            style={styles.documentMeta}
          >
            <View style={styles.metaItem}>
              <Ionicons
                name="git-branch-outline"
                size={14}
                color="#64748B"
              />

              <Text
                style={styles.metaText}
              >
                Version{" "}
                {document.current_version ||
                  1}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#64748B"
              />

              <Text
                style={styles.metaText}
              >
                {formatShortDate(
                  document.created_at
                )}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <View
                style={styles.activeDot}
              />

              <Text
                style={styles.metaText}
              >
                {document.status ||
                  "active"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={styles.documentActions}
      >
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            onOpen(document)
          }
        >
          <Ionicons
            name="open-outline"
            size={16}
            color="#334155"
          />

          <Text
            style={
              styles.actionButtonText
            }
          >
            Open
          </Text>
        </Pressable>

        {app && (
          <Pressable
            style={
              styles.microsoftActionButton
            }
            onPress={() =>
              onEdit(document)
            }
          >
            <Ionicons
              name={app.icon}
              size={16}
              color="#2563EB"
            />

            <Text
              style={
                styles.microsoftActionText
              }
            >
              Edit in {app.shortName}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={
            styles.versionActionButton
          }
          onPress={() =>
            onVersion(document)
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.versionActionText
            }
          >
            + Version
          </Text>
        </Pressable>

        <Pressable
          style={styles.moreButton}
          onPress={() =>
            onVersions(document)
          }
        >
          <Ionicons
            name="time-outline"
            size={18}
            color="#64748B"
          />
        </Pressable>
      </View>
    </View>
  );
}

function MicrosoftAppCard({
  app,
  onPress,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.microsoftCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.microsoftIcon}>
        <Ionicons
          name={app.icon}
          size={25}
          color="#2563EB"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={styles.microsoftName}
        >
          {app.name}
        </Text>

        <Text
          style={
            styles.microsoftDescription
          }
        >
          {app.description}
        </Text>
      </View>

      <View
        style={
          styles.openMicrosoftCircle
        }
      >
        <Ionicons
          name="arrow-up-right"
          size={17}
          color="#2563EB"
        />
      </View>
    </Pressable>
  );
}

function FundingRow({
  agreement,
  large = false,
}) {
  const status =
    agreement.status || "Unknown";

  return (
    <View
      style={[
        styles.fundingRow,
        large &&
          styles.fundingRowLarge,
      ]}
    >
      <View style={styles.fundingIcon}>
        <Ionicons
          name="wallet-outline"
          size={19}
          color="#2563EB"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={styles.fundingTitle}
        >
          {agreement.title ||
            agreement.name ||
            agreement.agreement_number ||
            "Funding Agreement"}
        </Text>

        <Text
          style={styles.fundingMeta}
        >
          {agreement.created_at
            ? formatShortDate(
                agreement.created_at
              )
            : "Agreement record"}
        </Text>
      </View>

      <View
        style={styles.statusPill}
      >
        <View
          style={styles.statusDot}
        />

        <Text
          style={
            styles.statusPillText
          }
        >
          {String(status).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function NotificationRow({
  notification,
  large = false,
}) {
  return (
    <View
      style={[
        styles.notificationRow,
        large &&
          styles.notificationRowLarge,
      ]}
    >
      <View
        style={styles.notificationIcon}
      >
        <Ionicons
          name={
            notification.read
              ? "notifications-outline"
              : "notifications"
          }
          size={18}
          color={
            notification.read
              ? "#64748B"
              : "#2563EB"
          }
        />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={
            styles.notificationTitleRow
          }
        >
          <Text
            style={
              styles.notificationTitle
            }
          >
            {notification.title}
          </Text>

          {!notification.read && (
            <View
              style={styles.unreadDot}
            />
          )}
        </View>

        <Text
          style={
            styles.notificationMessage
          }
        >
          {notification.message}
        </Text>

        <Text
          style={
            styles.notificationDate
          }
        >
          {formatDate(
            notification.created_at
          )}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onPress,
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={icon}
          size={28}
          color="#64748B"
        />
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text
        style={
          styles.emptyDescription
        }
      >
        {description}
      </Text>

      {buttonText && onPress && (
        <Pressable
          style={styles.emptyButton}
          onPress={onPress}
        >
          <Text
            style={styles.emptyButtonText}
          >
            {buttonText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyMini({
  icon,
  text,
}) {
  return (
    <View style={styles.emptyMini}>
      <Ionicons
        name={icon}
        size={21}
        color="#94A3B8"
      />

      <Text
        style={styles.emptyMiniText}
      >
        {text}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------
   STYLES
------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
  },

  /* SIDEBAR */

  sidebar: {
    width: 260,
    backgroundColor: "#0F172A",
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 18,
    justifyContent: "space-between",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  brandIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  brandSubtitle: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 27,
  },

  sidebarLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 9,
    paddingHorizontal: 10,
  },

  sidebarButton: {
    height: 46,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  sidebarButtonActive: {
    backgroundColor: "#2563EB",
  },

  sidebarButtonText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },

  sidebarButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  sidebarBadge: {
    minWidth: 23,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  sidebarBadgeActive: {
    backgroundColor: "#FFFFFF",
  },

  sidebarBadgeText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },

  sidebarBadgeTextActive: {
    color: "#2563EB",
  },

  sidebarHelp: {
    backgroundColor: "#172033",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  sidebarHelpTitle: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },

  sidebarHelpText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
  },

  backButton: {
    height: 42,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 9,
  },

  backButtonText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* MAIN */

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    height: 86,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    minWidth: 0,
  },

  pageTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "800",
  },

  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 10,
  },

  entityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    height: 23,
    borderRadius: 12,
  },

  entityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginRight: 6,
  },

  entityPillText: {
    color: "#1D4ED8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  headerDate: {
    color: "#94A3B8",
    fontSize: 11,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerNotification: {
    width: 39,
    height: 39,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },

  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
  },

  userInfo: {
    minWidth: 100,
  },

  userName: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },

  userEmail: {
    color: "#94A3B8",
    fontSize: 9,
    marginTop: 2,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 60,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  /* NOTICE */

  notice: {
    minHeight: 65,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 11,
  },

  noticeSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },

  noticeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  noticeWarning: {
    backgroundColor: "#FEFCE8",
    borderColor: "#FEF08A",
  },

  noticeInfo: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  noticeIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  noticeTitle: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },

  noticeMessage: {
    color: "#475569",
    fontSize: 11,
    lineHeight: 17,
  },

  /* WELCOME */

  welcomeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 20,
  },

  sectionEyebrow: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  welcomeTitle: {
    color: "#0F172A",
    fontSize: 27,
    fontWeight: "800",
  },

  welcomeDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 7,
    lineHeight: 19,
    maxWidth: 650,
  },

  primaryButton: {
    minHeight: 43,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#2563EB",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 37,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },

  /* STATS */

  statsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    minHeight: 142,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    padding: 17,
  },

  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 13,
  },

  statLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  statDescription: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 5,
  },

  /* SECTIONS */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
  },

  /* DOCUMENT PANEL */

  documentPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
    overflow: "hidden",
  },

  panelHeader: {
    minHeight: 73,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  panelTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  panelSubtitle: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
  },

  smallPrimaryButton: {
    height: 33,
    borderRadius: 7,
    backgroundColor: "#2563EB",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  smallPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  documentRow: {
    minHeight: 104,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  documentMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  documentIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  documentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  documentTitle: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 400,
  },

  fileTypePill: {
    height: 19,
    borderRadius: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    justifyContent: "center",
  },

  fileTypePillText: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  documentDescription: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
  },

  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 13,
    marginTop: 7,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    color: "#64748B",
    fontSize: 9,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  documentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionButton: {
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  actionButtonText: {
    color: "#334155",
    fontSize: 9,
    fontWeight: "700",
  },

  microsoftActionButton: {
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  microsoftActionText: {
    color: "#1D4ED8",
    fontSize: 9,
    fontWeight: "800",
  },

  versionActionButton: {
    height: 34,
    borderRadius: 7,
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  versionActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  /* TWO COLUMNS */

  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },

  infoPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    overflow: "hidden",
  },

  /* FUNDING */

  fundingRow: {
    minHeight: 65,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  fundingRowLarge: {
    minHeight: 76,
  },

  fundingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  fundingTitle: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },

  fundingMeta: {
    color: "#94A3B8",
    fontSize: 9,
    marginTop: 3,
  },

  statusPill: {
    height: 23,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  statusPillText: {
    color: "#15803D",
    fontSize: 7,
    fontWeight: "900",
  },

  /* NOTIFICATIONS */

  notificationRow: {
    minHeight: 75,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    gap: 11,
  },

  notificationRowLarge: {
    minHeight: 90,
  },

  notificationIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  notificationTitle: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
  },

  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563EB",
  },

  notificationMessage: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  notificationDate: {
    color: "#94A3B8",
    fontSize: 8,
    marginTop: 4,
  },

  linkText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "800",
  },

  /* PAGE SECTIONS */

  pageSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 22,
    gap: 20,
  },

  pageSectionTitle: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
  },

  pageSectionDescription: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 17,
  },

  searchContainer: {
    height: 45,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: "#334155",
    fontSize: 11,
    marginLeft: 9,
    outlineStyle: "none",
  },

  /* EMPTY */

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyDescription: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 380,
    marginTop: 5,
  },

  emptyButton: {
    height: 34,
    borderRadius: 7,
    backgroundColor: "#2563EB",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  emptyMini: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },

  emptyMiniText: {
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "center",
  },

  loadingDocuments: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingDocumentsText: {
    color: "#94A3B8",
    fontSize: 10,
  },

  /* MODAL */

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 590,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },

  modalCardLarge: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },

  modalHeader: {
    minHeight: 76,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  modalTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
  },

  modalClose: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: 22,
    paddingBottom: 30,
  },

  modalSectionLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 7,
  },

  modalExplanation: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 17,
    marginBottom: 15,
  },

  microsoftCard: {
    minHeight: 73,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 9,
    backgroundColor: "#FFFFFF",
  },

  pressed: {
    opacity: 0.7,
  },

  microsoftIcon: {
    width: 43,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  microsoftName: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },

  microsoftDescription: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  openMicrosoftCircle: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  modalDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 13,
  },

  dividerLine: {
    height: 1,
    backgroundColor: "#E2E8F0",
    flex: 1,
  },

  dividerText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },

  uploadExistingButton: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FBFF",
  },

  uploadExistingIcon: {
    width: 43,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadExistingTitle: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },

  uploadExistingDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },

  uploadingText: {
    color: "#64748B",
    fontSize: 10,
  },

  /* VERSION MODAL */

  versionDocumentCard: {
    margin: 22,
    marginBottom: 18,
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  fileIconLarge: {
    width: 45,
    height: 45,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  versionDocumentTitle: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },

  versionDocumentMeta: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 4,
  },

  inputLabel: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginHorizontal: 22,
    marginBottom: 7,
  },

  textArea: {
    minHeight: 95,
    marginHorizontal: 22,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    padding: 11,
    color: "#334155",
    fontSize: 10,
    textAlignVertical: "top",
    outlineStyle: "none",
  },

  saveVersionButton: {
    minHeight: 44,
    marginHorizontal: 22,
    marginTop: 16,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  saveVersionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  versionHelpText: {
    color: "#94A3B8",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
    paddingHorizontal: 35,
    paddingVertical: 13,
  },

  /* VERSION HISTORY */

  versionRow: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    gap: 13,
  },

  versionNumber: {
    width: 43,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  versionNumberCurrent: {
    backgroundColor: "#DBEAFE",
  },

  versionNumberText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },

  versionNumberTextCurrent: {
    color: "#1D4ED8",
  },

  versionRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  versionRowTitle: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
  },

  currentPill: {
    height: 19,
    borderRadius: 5,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    justifyContent: "center",
  },

  currentPillText: {
    color: "#15803D",
    fontSize: 7,
    fontWeight: "900",
  },

  versionSummary: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  versionDate: {
    color: "#94A3B8",
    fontSize: 8,
    marginTop: 5,
  },

  /* LOADING */

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 30,
    alignItems: "center",
  },

  loadingLogo: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
  },

  loadingSubtitle: {
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },
});