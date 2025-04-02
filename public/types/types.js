"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFaculty = exports.UserType = exports.StorageStatus = exports.StorageSize = exports.UserDepartment = exports.DocumentTypes = exports.DocumentStatus = exports.UserStatus = exports.Gender = exports.UserPermission = exports.UserRoles = exports.Schools = void 0;
// SCHOOL LIST
var Schools;
(function (Schools) {
    Schools["IAUE"] = "Ignatius Ajuru University";
    Schools["RSU"] = "Rivers State University";
    Schools["UNIPORT"] = "University of Port Harcourt";
    Schools["UNILAG"] = "University of Lagos";
    Schools["UNIVERSITY_OF_Ibadan"] = "University of Ibadan";
    Schools["UNIUYO"] = "University of Uyo";
})(Schools || (exports.Schools = Schools = {}));
var UserRoles;
(function (UserRoles) {
    UserRoles["SUPERADMIN"] = "Super Admin";
    UserRoles["ADMIN"] = "Admin";
    UserRoles["STUDENT"] = "Student";
    UserRoles["TEACHER"] = "Teacher";
    UserRoles["MANAGER"] = "Manager";
    UserRoles["DOCUMENT_MANAGER"] = "Document Manager";
    UserRoles["DOCUMENT_VIEWER"] = "Document Viewer";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
var UserPermission;
(function (UserPermission) {
    UserPermission["CREATE"] = "create_file";
    UserPermission["READ"] = "read_file";
    UserPermission["UPDATE"] = "update_file";
    UserPermission["DELETE"] = "delete_file";
    UserPermission["DOWNLOAD"] = "download_file";
})(UserPermission || (exports.UserPermission = UserPermission = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["DELETED"] = "deleted";
    UserStatus["BLOCKED"] = "blocked";
    UserStatus["EXPIRED"] = "expired";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["UPLOADED"] = "success";
    DocumentStatus["UPLOADING"] = "uploading";
    DocumentStatus["APPROVED"] = "approved";
    DocumentStatus["REJECTED"] = "rejected";
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["DELETED"] = "deleted";
    DocumentStatus["ERROR"] = "error";
    DocumentStatus["VIEWED"] = "viewed";
    DocumentStatus["RESUBMIT"] = "resubmit";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var DocumentTypes;
(function (DocumentTypes) {
    DocumentTypes["PDF"] = "pdf";
    DocumentTypes["EXCEL"] = "excel";
    DocumentTypes["PNG"] = "png";
    DocumentTypes["JPG"] = "png";
    DocumentTypes["DOCX"] = "docx";
})(DocumentTypes || (exports.DocumentTypes = DocumentTypes = {}));
// USER DEPARTMENT
var UserDepartment;
(function (UserDepartment) {
    UserDepartment["COMPUTER_SCIENCE"] = "Computer Science";
    UserDepartment["ENGLISH"] = "English";
    UserDepartment["MATHS"] = "Mathematics";
    UserDepartment["SCIENCE"] = "Science";
    UserDepartment["SOCIAL_STUDIES"] = "Social Studies";
})(UserDepartment || (exports.UserDepartment = UserDepartment = {}));
var StorageSize;
(function (StorageSize) {
    StorageSize[StorageSize["IGB"] = 1073741824] = "IGB";
    StorageSize[StorageSize["TWOGB"] = 2147483648] = "TWOGB";
    StorageSize[StorageSize["FOURGB"] = 4294967296] = "FOURGB";
    StorageSize[StorageSize["EIGHTGB"] = 8589934592] = "EIGHTGB";
    StorageSize[StorageSize["THIRTEENGB"] = 13958643712] = "THIRTEENGB";
    StorageSize[StorageSize["FIFTEENGB"] = 16106127360] = "FIFTEENGB";
    StorageSize[StorageSize["TWENTYGB"] = 21474836480] = "TWENTYGB";
    StorageSize[StorageSize["TWENTYFIVEGB"] = 26843545600] = "TWENTYFIVEGB";
    StorageSize[StorageSize["THIRTYGB"] = 32212254720] = "THIRTYGB";
    StorageSize[StorageSize["FORTYGB"] = 42949672960] = "FORTYGB";
    StorageSize[StorageSize["SIXTYGB"] = 64424509440] = "SIXTYGB";
    StorageSize[StorageSize["SEVENTYGB"] = 75161927680] = "SEVENTYGB";
    StorageSize[StorageSize["EIGHTYGB"] = 85899345920] = "EIGHTYGB";
    StorageSize[StorageSize["TB"] = 1099511627776] = "TB";
})(StorageSize || (exports.StorageSize = StorageSize = {}));
var StorageStatus;
(function (StorageStatus) {
    StorageStatus["active"] = "active";
    StorageStatus["low"] = "low";
    StorageStatus["exhausted"] = "exhausted";
})(StorageStatus || (exports.StorageStatus = StorageStatus = {}));
var UserType;
(function (UserType) {
    UserType["STUDENT"] = "student";
    UserType["TEACHER"] = "teacher";
    UserType["VENDOR"] = "vendor";
    UserType["OWNER"] = "owner";
})(UserType || (exports.UserType = UserType = {}));
var UserFaculty;
(function (UserFaculty) {
    UserFaculty["ICT"] = "Information and Communication Technology";
    UserFaculty["ARTS"] = "Arts";
    UserFaculty["SCIENCES"] = "Science";
    UserFaculty["LAW"] = "Law";
    UserFaculty["BUSINESS"] = "Business";
    UserFaculty["ENGINEERING"] = "Engineering";
    UserFaculty["HEALTH_AND_BEHAVIOR"] = "Health and Behavior";
    UserFaculty["CMS"] = "Applied and Natural Science";
})(UserFaculty || (exports.UserFaculty = UserFaculty = {}));
