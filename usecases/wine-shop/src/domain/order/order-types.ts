import type { ShippingDestination } from "@/data/shipping-destinations";
import type { CartItem } from "@/domain/catalog/catalog-types";
import type {
	NormalizedPidClaims,
	VerificationPolicy,
} from "@/domain/verification/verification-types";

export type OrderLifecycleStatus =
	| "draft"
	| "reviewed"
	| "awaiting_verification"
	| "verified"
	| "payment_confirmed"
	| "completed"
	| "failed";

export type OrderConfirmation = {
	orderReference: string;
	completedAt: string;
	items: CartItem[];
	total: number;
	shippingDestination: ShippingDestination;
	policy: VerificationPolicy | null;
	disclosedClaims: NormalizedPidClaims | null;
};

export type OrderState = {
	status: OrderLifecycleStatus;
	orderId: string | null;
	items: CartItem[];
	shippingDestination: ShippingDestination | null;
	confirmation: OrderConfirmation | null;
	updatedAt: string;
	lastError: string | null;
};

export type OrderTransitionResult =
	| {
			ok: true;
			state: OrderState;
	  }
	| {
			ok: false;
			error: string;
			state: OrderState;
	  };
