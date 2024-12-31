export interface AreaDetection {
    positionX: number;
    positionY: number;
    size: number;
}
export interface PictureModel {
    filename: string,
    area?: AreaDetection;
}