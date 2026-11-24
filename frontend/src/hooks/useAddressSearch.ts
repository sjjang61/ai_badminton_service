// 카카오 우편번호 서비스 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void
        onclose?: () => void
        width?: number
        height?: number
      }) => { open: () => void }
    }
  }
}

export interface DaumPostcodeResult {
  zonecode: string       // 우편번호
  roadAddress: string    // 도로명 주소
  jibunAddress: string   // 지번 주소
  buildingName: string   // 건물명
  apartment: string      // 아파트 여부
}

export interface AddressResult {
  zonecode: string
  roadAddress: string
  jibunAddress: string
}

export function useAddressSearch() {
  const open = (onSelect: (result: AddressResult) => void) => {
    if (!window.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete(data) {
        onSelect({
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
        })
      },
    }).open()
  }

  return { open }
}
