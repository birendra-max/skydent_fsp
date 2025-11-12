import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel(data, file_name) {
    //convert json data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    //create a new workbook
    const workbook = XLSX.utils.book_new();

    //Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    //Generate excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    //create a blob and download
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${file_name}.xlsx`);
}
