import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@cossplay/ui/components/field"
import { OTPField, OTPFieldInput } from "@cossplay/ui/components/otp-field"

const OTP_LENGTH = 4

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`
)

export default function Particle() {
  return (
    <Field className="items-center">
      <FieldLabel>验证码</FieldLabel>
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`第 ${index + 1} 位，共 ${OTP_LENGTH} 位`}
          />
        ))}
      </OTPField>
      <FieldDescription>
        输入发到邮箱的 {OTP_LENGTH} 位验证码。
      </FieldDescription>
    </Field>
  )
}
