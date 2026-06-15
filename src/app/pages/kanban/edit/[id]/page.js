"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/component/common/Breadcrumb";
import Button from "@/component/common/Button";
import DropDown from "@/component/common/Dropdown";
import Input from "@/component/common/Input";
import Loading from "@/component/common/Loading";
import Toast from "@/component/common/Toast";
import { createActionLog } from "@/lib/actionLog";
import fetchData from "@/lib/fetch";
import uploadFile from "@/lib/upload";
import generateVoice from "@/lib/generateVoice";
import { getKanbanErrorMessage, normalizeOptionalText } from "@/lib/kanbanForm";

const initialForm = {
    no: "",
    colorId: "",
    uniqNo: "",
    qtyBox: "",
    sequenceCheckDesc: "",
    logisticGuideDesc: "",
    instructionWorkPath: "",
    sequenceCheckPath: "",
    logisticGuidePath: "",
    sequenceCheckVoicePath: "",
    logisticGuideVoicePath: "",
    stamp: "",
    deviceNo: "",
    certMark: "",
    remark: "",
};

const toOptions = (data, getText) =>
    data.map((item) => ({
        Value: item.Id,
        Text: getText(item),
    }));

const SectionTitle = ({ title }) => (
    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
        <h6 className="mb-0" style={{ fontSize: 14, fontWeight: 600 }}>{title}</h6>
    </div>
);

const normalizeKanban = (data = {}) => ({
    no: data.Id || "",
    colorId: data.ColorId || "",
    uniqNo: data.UniqNo === "-" ? "" : data.UniqNo || "",
    qtyBox: data.QtyBox ?? "",
    sequenceCheckDesc: data.SequenceCheckDesc || "",
    logisticGuideDesc: data.LogisticGuideDesc || "",
    instructionWorkPath: data.InstructionWorkPath || "",
    sequenceCheckPath: data.SequenceCheckPath || "",
    logisticGuidePath: data.LogisticGuidePath || "",
    sequenceCheckVoicePath: data.SequenceCheckVoicePath || "",
    logisticGuideVoicePath: data.LogisticGuideVoicePath || "",
    stamp: data.Stamp || "",
    deviceNo: data.DeviceNo || "",
    certMark: data.CertMark || "",
    remark: data.Remark || "",
});

export default function EditKanbanPage() {
    const router = useRouter();
    const params = useParams();
    const encryptedId = params?.id;

    const [form, setForm] = useState(initialForm);
    const [originalForm, setOriginalForm] = useState(null);
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [instructionFile, setInstructionFile] = useState(null);
    const [sequenceFile, setSequenceFile] = useState(null);
    const [logisticFile, setLogisticFile] = useState(null);

    const handleFileChange = (e,setter) => {
        const selectedFile = e.target.files?.[0];

        if (selectedFile) {
            const maxSize = 2 * 1024 * 1024;
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

            if (selectedFile.size > maxSize) {
                Toast.error("Failed because the maximum file size is 2MB");
                return;
            }

            if(!allowedTypes.includes(selectedFile.type)) {
                Toast.error("Failed because the file format must be PDF, JPEG, or PNG");
                return;
            }
        }

        setter(selectedFile || null);
    }

    useEffect(() => {
        if (!encryptedId) {
            router.replace("/pages/kanban");
            return;
        }

        let isActive = true;

        const loadData = async () => {
            setLoading(true);

            try {
                const [kanbanResponse, colorResponse] = await Promise.all([
                    fetchData(`kanbans/${encryptedId}`, {}, "GET"),
                    fetchData("colors", { Status: 1, PageNumber: 1, PageSize: 1000 }, "GET"),
                ]);

                if (!isActive) return;

                if (kanbanResponse.error) throw new Error(kanbanResponse.message);
                if (colorResponse.error) throw new Error(colorResponse.message);

                const normalized = normalizeKanban(kanbanResponse.data);
                setForm(normalized);
                setOriginalForm(normalized);
                setColors(toOptions(colorResponse.data?.data || [], (item) => item.Name || "-"));
            } catch (error) {
                Toast.error(getKanbanErrorMessage(error, "Failed because Kanban was not found"));
                router.replace("/pages/kanban");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, [encryptedId, router]);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const getChangeText = () => {
        if (!originalForm) {
            return { oldValue: null, newValue: `Kanban: ${form.no}` };
        }

        const oldValues = [];
        const newValues = [];

        Object.keys(form).forEach((key) => {
            if (String(originalForm[key] ?? "") !== String(form[key] ?? "")) {
                oldValues.push(`${key}: ${originalForm[key] || "-"}`);
                newValues.push(`${key}: ${form[key] || "-"}`);
            }
        });

        return {
            oldValue: oldValues.join(", "),
            newValue: newValues.join(", "),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const uploadInstructionResult = instructionFile
            ? await uploadFile(instructionFile, "ikwc")
            : { error: false };

            if(uploadInstructionResult.error){
                setSaving(false);
                Toast.error(getKanbanErrorMessage(uploadInstructionResult, "Failed because the Instruction Work file could not be uploaded"));
                return;
            }

            const uploadSequenceCheckResult = sequenceFile
            ? await uploadFile(sequenceFile, "sequence_check")
            : { error: false };

            if(uploadSequenceCheckResult.error){
                setSaving(false);
                Toast.error(getKanbanErrorMessage(uploadSequenceCheckResult, "Failed because the Sequence Check file could not be uploaded"));
                return;
            }

            const uploadLogisticResult = logisticFile
            ? await uploadFile(logisticFile, "logistic_check")
            : { error: false };

            if(uploadLogisticResult.error){
                setSaving(false);
                Toast.error(getKanbanErrorMessage(uploadLogisticResult, "Failed because the Logistic Guide file could not be uploaded"));
                return;
            }

            const shouldGenerateSequenceVoice =
                form.sequenceCheckDesc?.trim() &&
                (form.sequenceCheckDesc !== originalForm?.sequenceCheckDesc ||
                    !form.sequenceCheckVoicePath);

            const generateSequenceVoiceResult = shouldGenerateSequenceVoice
            ? await generateVoice(form.sequenceCheckDesc, "sc_voice")
            : { error: false, data: form.sequenceCheckVoicePath };

            if(generateSequenceVoiceResult.error){
                setSaving(false);
                Toast.error(getKanbanErrorMessage(generateSequenceVoiceResult, "Failed because the Sequence Check voice could not be generated"));
                return;
            }

            const shouldGenerateLogisticVoice =
                form.logisticGuideDesc?.trim() &&
                (form.logisticGuideDesc !== originalForm?.logisticGuideDesc ||
                    !form.logisticGuideVoicePath);

            const generateLogisticVoiceResult = shouldGenerateLogisticVoice
            ? await generateVoice(form.logisticGuideDesc, "lc_voice")
            : { error: false, data: form.logisticGuideVoicePath };

            if(generateLogisticVoiceResult.error){
                setSaving(false);
                Toast.error(getKanbanErrorMessage(generateLogisticVoiceResult, "Failed because the Logistic Guide voice could not be generated"));
                return;
            }

            const payload = {
                ...form,
                uniqNo: normalizeOptionalText(form.uniqNo),
                deviceNo: normalizeOptionalText(form.deviceNo),
                certMark: normalizeOptionalText(form.certMark),
                instructionWorkPath: uploadInstructionResult.data,
                sequenceCheckPath: uploadSequenceCheckResult.data,
                logisticGuidePath: uploadLogisticResult.data,
                sequenceCheckVoicePath: generateSequenceVoiceResult.data || "",
                logisticGuideVoicePath: generateLogisticVoiceResult.data || "",
            }

            const response = await fetchData(`kanbans/${encryptedId}`, payload, "PUT");

            if (response.error) {
                throw new Error(response.message);
            }

            const changes = getChangeText();

            if (changes.newValue) {
                const logResponse = await createActionLog({
                    action: "UPDATE",
                    oldValue: changes.oldValue,
                    newValue: changes.newValue,
                });

                if (logResponse.error) {
                    throw new Error(logResponse.message || "Kanban updated, but action log failed");
                }
            }

            Toast.success(response.message || "Kanban updated successfully");
            router.push("/pages/kanban");
        } catch (error) {
            Toast.error(getKanbanErrorMessage(error, "Failed to update kanban"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Loading loading={loading || saving} message={saving ? "Saving data..." : "Loading data..."} />
            <Breadcrumb
                title="Edit Kanban"
                items={[
                    { label: "Kanban Management", href: "/pages/kanban" },
                    { label: "Edit" },
                ]}
            />
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <SectionTitle title="Basic Information" />
                        <div className="row">
                            <div className="col-lg-3">
                                <Input
                                    label="Kanban No"
                                    name="no"
                                    value={form.no}
                                    onChange={(e) => updateField("no", e.target.value)}
                                    disabled
                                />
                            </div>
                            <div className="col-lg-3">
                                <Input
                                    label="Unique No"
                                    name="uniqNo"
                                    value={form.uniqNo}
                                    onChange={(e) => updateField("uniqNo", e.target.value)}
                                    maxLength={15}
                                />
                            </div>
                            <div className="col-lg-3">
                                <Input
                                    label="Qty / Box"
                                    name="qtyBox"
                                    type="number"
                                    value={form.qtyBox}
                                    onChange={(e) => updateField("qtyBox", e.target.value)}
                                />
                            </div>
                            <div className="col-lg-3">
                                <DropDown
                                    arrData={colors}
                                    type="choose"
                                    label="Color"
                                    forInput="colorId"
                                    value={form.colorId}
                                    onChange={(e) => updateField("colorId", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-3">
                                <Input
                                    label="Stamp"
                                    name="stamp"
                                    value={form.stamp}
                                    onChange={(e) => updateField("stamp", e.target.value)}
                                    maxLength={5}
                                />
                            </div>
                            <div className="col-lg-3">
                                <Input
                                    label="Device No"
                                    name="deviceNo"
                                    value={form.deviceNo}
                                    onChange={(e) => updateField("deviceNo", e.target.value)}
                                    maxLength={3}
                                />
                            </div>
                            <div className="col-lg-3">
                                <Input
                                    label="Cert Mark"
                                    name="certMark"
                                    value={form.certMark}
                                    onChange={(e) => updateField("certMark", e.target.value)}
                                    maxLength={3}
                                />
                            </div>
                            <div className="col-lg-3">
                                <Input
                                    label="Remark"
                                    name="remark"
                                    value={form.remark}
                                    onChange={(e) => updateField("remark", e.target.value)}
                                    maxLength={55}
                                />
                            </div>
                        </div>

                        <SectionTitle title="Document Files" />
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Instruction Work"
                                    type="file"
                                    onChange={(e) => handleFileChange(e,setInstructionFile)}
                                />
                                {form.instructionWorkPath && !instructionFile && (
                                    <small className="text-muted">
                                        Current file: {form.instructionWorkPath.split('/').pop()}
                                    </small>
                                )}
                            </div>
                            <div className="col-lg-4">
                                <Input 
                                    label="Sequence Check"
                                    type="file"
                                    onChange={(e) => handleFileChange(e,setSequenceFile)}
                                />
                                {form.sequenceCheckPath && !sequenceFile && (
                                    <small className="text-muted">
                                        Current file: {form.sequenceCheckPath.split('/').pop()}
                                    </small>
                                )}
                            </div>
                            <div className="col-lg-4">
                                <Input 
                                    label="Logistic Guide"
                                    type="file"
                                    onChange={(e) => handleFileChange(e,setLogisticFile)}
                                />
                                {form.logisticGuidePath && !logisticFile && (
                                    <small className="text-muted">
                                        Current file: {form.logisticGuidePath.split('/').pop()}
                                    </small>
                                )}
                            </div>
                        </div>

                        <SectionTitle title="Guidance Descriptions" />
                        <div className="row">
                            <div className="col-lg-6">
                                <Input
                                    label="Sequence Check Description"
                                    name="sequenceCheckDesc"
                                    value={form.sequenceCheckDesc}
                                    onChange={(e) => updateField("sequenceCheckDesc", e.target.value)}
                                />
                            </div>
                            <div className="col-lg-6">
                                <Input
                                    label="Logistic Guide Description"
                                    name="logisticGuideDesc"
                                    value={form.logisticGuideDesc}
                                    onChange={(e) => updateField("logisticGuideDesc", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        classType="secondary"
                                        iconName="arrow-left"
                                        label="Back"
                                        onClick={() => router.push("/pages/kanban")}
                                    />
                                    <Button
                                        type="submit"
                                        classType="primary"
                                        iconName={saving ? "" : "save"}
                                        label={saving ? "Saving..." : "Save"}
                                        isDisabled={saving}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
