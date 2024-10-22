import { SelectOption } from "@/components/Select/ReactSelect.tsx";

export interface Model {
  created_at: string;
  updated_at: string;
}

export interface OptionsData {
  data: SelectOption[];
  isLoading: boolean;
}

export interface User {
  id: string;
  external_id: string;
  name: string;
  email: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  location: Location;
}

export interface Store extends Model {
  id: string;
  name: string;
  location: Location;
  organization: Organization;
}
