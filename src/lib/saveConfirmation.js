import SweetAlert from "@/component/common/SweetAlert";

export const confirmSaveChanges = async (entityName = "data") => {
  const result = await SweetAlert({
    title: "Save Changes",
    text: `Are you sure you want to save this ${entityName}?`,
    icon: "warning",
    confirmText: "Yes, save",
  });

  return Boolean(result);
};
