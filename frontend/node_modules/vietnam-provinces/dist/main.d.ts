import { Province, District, Ward, ProvinceDetail } from './types';
export declare const provinces: Province[];
export declare const districts: District[];
export declare const wards: Ward[];
export declare const getProvinces: () => Province[];
export declare const getDistricts: (province_code?: string | undefined) => District[];
export declare const getWards: (district_code?: string | undefined) => Ward[];
export declare const getProvincesWithDetail: (code?: string | undefined) => ProvinceDetail;
export { Province, District, Ward, ProvinceDetail };
