// To parse this data:
//
//   import { Convert, Usermodel } from "./file";
//
//   const usermodel = Convert.toUsermodel(json);

export interface Usermodel {
    user_id:         number;
    name:            string;
    email:           string;
    hashed_password: string;
    profile:         string;
    role:            string;
    is_active:       number;
    is_verify:       number;
    create_at:       Date;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toUsermodel(json: string): Usermodel {
        return JSON.parse(json);
    }

    public static usermodelToJson(value: Usermodel): string {
        return JSON.stringify(value);
    }
}
